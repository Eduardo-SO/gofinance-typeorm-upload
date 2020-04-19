import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Response {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    categoryTitle,
  }: Response): Promise<Transaction> {
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('This transaction type is not permited', 401);
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError('You have no balance available', 400);
    }

    const categoriesRepository = getRepository(Category);

    const category = await categoriesRepository.findOne({
      where: { title: categoryTitle },
    });

    if (!category) {
      const newCategory = categoriesRepository.create({ title: categoryTitle });

      await categoriesRepository.save(newCategory);

      const transaction = transactionsRepository.create({
        title,
        type,
        value,
        category_id: newCategory.id,
      });

      await transactionsRepository.save(transaction);
      return transaction;
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: category.id,
    });

    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
