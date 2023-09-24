import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { AuthUser } from '../auth/decorators/authUser.decorator';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';

import { UsersService } from './users.service';
import { UsersCacheService } from './usersCache.service';

import { GetUserParams } from './dto/getUserParams.dto';
import { UpdateUserParams } from './dto/updateUserParams.dto';
import { UpdateUserBodyDto } from './dto/updateUserBody.dto';
import { UserResponseDto } from './dto/userResponse.dto';

import { JwtUser } from './types';

@Controller('/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private usersCacheService: UsersCacheService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/:userId')
  async getOneById(
    @AuthUser() currentUser: JwtUser,
    @Param() params: GetUserParams,
  ): Promise<UserResponseDto> {
    const cacheUser = await this.usersCacheService.getOneById({
      userId: params.userId,
    });

    if (cacheUser) {
      return plainToClass(UserResponseDto, cacheUser);
    }

    const user = await this.usersService.getOneByIdOrFail(params.userId);

    this.usersCacheService.setOneById(
      {
        userId: user.id,
      },
      user,
    );

    return plainToClass(UserResponseDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:userId')
  async update(
    @AuthUser() user: JwtUser,
    @Param() params: UpdateUserParams,
    @Body() updateUserDto: UpdateUserBodyDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.update(
      params.userId,
      updateUserDto,
    );

    await this.usersCacheService.resetOneById({ userId: updatedUser.id });

    return plainToClass(UserResponseDto, updatedUser);
  }
}
