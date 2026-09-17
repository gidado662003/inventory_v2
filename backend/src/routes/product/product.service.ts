import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import {
  CreateProductInput,
  ProductAliasesInput,
  updateProductInput,
} from "./product.schema";
const productService = {
  createProduct: async (product: CreateProductInput) => {
    const exist = await prisma.product.findFirst({
      where: {
        name: product.name,
      },
    });

    if (exist) {
      throw new AppError("product already exist", 400);
    }

    const { aliases, ...productData } = product;

    const newProduct = await prisma.product.create({
      data: {
        ...productData,

        aliases: aliases
          ? {
              create: aliases.map((name) => ({
                name,
              })),
            }
          : undefined,
      },
      include: {
        aliases: true,
      },
    });

    return newProduct;
  },
  getProduct: async (searchString?: string) => {
    const product = await prisma.product.findMany({
      where: searchString
        ? {
            OR: [
              {
                name: {
                  contains: searchString,
                  mode: "insensitive",
                },
              },
              {
                aliases: {
                  some: {
                    name: {
                      contains: searchString,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : undefined,

      include: {
        aliases: true,
      },

      orderBy: {
        stockQuantity: "desc",
      },
    });

    return product;
  },
  updateProduct: async (productId: string, data: updateProductInput) => {
    const update = await prisma.product.update({
      where: { id: productId },
      data: {
        ...data,

        aliases: data.aliases
          ? {
              create: data.aliases.map((name) => ({
                name,
              })),
            }
          : undefined,
      },
      include: { aliases: true },
    });
    return update;
  },
  getProductById: async (productId: string) => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { aliases: true },
    });
    if (!product) {
      throw new AppError("product not found", 404);
    }
    return product;
  },
};

export default productService;
