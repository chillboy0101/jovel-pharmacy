import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cat = searchParams.get("cat");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    const badge = searchParams.get("badge");
    const limit = searchParams.get("limit");
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");
    const all = searchParams.get("all") === "1";
    const fields = searchParams.get("fields");
    const exportMode = searchParams.get("export") === "1";

    if (all) {
      const session = await auth();
      const role = (session?.user as { role?: string } | undefined)?.role;
      if (!session?.user || !role || !["ADMIN", "STAFF"].includes(role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const where: any = {};
    const and: any[] = [];

    // Filter out expired products by default (storefront). Admin requests (?all=1) should see everything.
    if (!all) {
      and.push({ OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }] });
      // Only show products with an image on the storefront
      and.push({ imageUrl: { not: null } });
      and.push({ imageUrl: { not: "" } });
      and.push({ imageUrl: { not: "null" } });
    }

    if (cat && cat !== "all") where.categoryId = cat;
    if (badge) where.badge = badge;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (and.length) where.AND = and;

    let orderBy: any | undefined;
    switch (sort) {
      case "rating": {
        orderBy = [{ rating: "desc" }, { reviews: "desc" }, { createdAt: "desc" }];
        break;
      }
      case "name": orderBy = { name: "asc" }; break;
      case "sale": {
        orderBy = [{ rating: "desc" }, { reviews: "desc" }, { createdAt: "desc" }];
        break;
      }
      case "bestseller": {
        orderBy = [{ rating: "desc" }, { reviews: "desc" }, { createdAt: "desc" }];
        break;
      }
      case "new": orderBy = { createdAt: "desc" }; break;
    }

    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : undefined;
    const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const safePageSize = Number.isFinite(parsedPageSize) && parsedPageSize! > 0
      ? Math.min(200, parsedPageSize!)
      : 60;

    const take = limit ? Math.min(200, Math.max(1, parseInt(limit, 10))) : safePageSize;
    const skip = (safePage - 1) * take;

    const shouldPaginate = !exportMode;

    const totalCount = await prisma.product.count({ where });

    const select =
      fields === "adminList" || exportMode
        ? {
            id: true,
            name: true,
            categoryId: true,
            stock: true,
            badge: true,
            rating: true,
            reviews: true,
            emoji: true,
            imageUrl: true,
            expiryDate: true,
            sourceSlug: true,
            sourceUrl: true,
          }
        : undefined;

    const products = await prisma.product.findMany({
      where,
      orderBy,
      ...(select ? { select } : {}),
      ...(shouldPaginate ? { take, skip } : {}),
    });

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": all
          ? "private, no-store"
          : "public, s-maxage=60, stale-while-revalidate=300",
        "X-Total-Count": String(totalCount),
        "X-Page": String(safePage),
        "X-Page-Size": String(take),
        "X-Total-Pages": String(Math.max(1, Math.ceil(totalCount / take))),
      },
    });
  } catch (err) {
    console.error("[/api/products GET]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

const createProductSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().min(1),
  dosage: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  badge: z.string().optional(),
  emoji: z.string().default("💊"),
  imageUrl: z.string().url().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  sourceSlug: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createProductSchema.parse(body);
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    const { categoryId, ...rest } = data;

    const product = await prisma.product.create({
      data: {
        ...rest,
        expiryDate,
        category: { connect: { id: categoryId } },
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
