-- CreateTable
CREATE TABLE "SaleEditLog" (
    "id" UUID NOT NULL,
    "saleId" UUID NOT NULL,
    "editedById" UUID NOT NULL,
    "previousTotalAmount" DECIMAL(12,2) NOT NULL,
    "newTotalAmount" DECIMAL(12,2) NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleEditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaleEditLog_saleId_idx" ON "SaleEditLog"("saleId");

-- AddForeignKey
ALTER TABLE "SaleEditLog" ADD CONSTRAINT "SaleEditLog_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleEditLog" ADD CONSTRAINT "SaleEditLog_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
