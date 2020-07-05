import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export default class ModifyColumnPriceOrdersProducts1593914019727
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'orders_products',
      'price',
      new TableColumn({
        name: 'price',
        type: 'decimal',
        precision: 10,
        scale: 2,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('orders_products', 'price');
  }
}
