import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async getOne(options: {
    where: Prisma.UserWhereInput;
  }): Promise<User | null> {
    const { where } = options;
    return await this.prisma.user.findFirst({ where });
  }

  async create(options: { data: Prisma.UserCreateInput }): Promise<User> {
    const { data } = options;
    return this.prisma.user.create({ data });
  }
}
