import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exists');
    }

    const productsId = products.map(prod => {
      const { id } = prod;

      return { id };
    });

    const productsFinded = await this.productsRepository.findAllById(
      productsId,
    );

    if (productsFinded.length !== products.length) {
      throw new AppError('The order contains one or more products invalids');
    }

    let productsInvalid = false;

    products.forEach((productMap, index) => {
      const result =
        !productMap.quantity ||
        productMap.quantity < 1 ||
        productMap.quantity > productsFinded[index].quantity
          ? (productsInvalid = true)
          : productsInvalid;

      return result;
    });

    if (productsInvalid) {
      throw new AppError(
        'The order contains one or more products with invalids quantities',
      );
    }

    const productsQuantitiesUpdated = productsFinded.map(
      (productMap, index) => {
        const { id, quantity } = productMap;

        const quantityResult = quantity - products[index].quantity;

        return {
          id,
          quantity: quantityResult,
        };
      },
    );

    await this.productsRepository.updateQuantity(productsQuantitiesUpdated);

    const iProducts = productsFinded.map((productMap, index) => {
      const { id, price } = productMap;

      const { quantity } = products[index];

      return { product_id: id, price, quantity };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: iProducts,
    });

    return order;
  }
}

export default CreateOrderService;
