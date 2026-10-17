import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import {
  CreateProductInput,
  ProductAliasesInput,
  updateProductInput,
} from "./product.schema";
import movementService from "../inventory-movement/movement.service";
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

    const createProduct = await prisma.$transaction(async (tx) => {
      const newProduct = tx.product.create({
        data: {
          ...productData,
          stockQuantity: 0,

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
      await movementService.createMovementTx(tx, {
        productId: (await newProduct).id,
        type: "INITIAL_STOCK",
        quantity: product.stockQuantity,
      });
      return tx.product.findUniqueOrThrow({
        where: {
          id: (await newProduct).id,
        },
        include: {
          aliases: true,
        },
      });
    });

    return createProduct;
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
