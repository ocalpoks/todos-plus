import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as argon2 from 'argon2';

import { RefreshTokensRepository } from './repositories/refreshTokens.repository';

export type PairKey = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokensRepository: RefreshTokensRepository,
  ) {}

  /**
   * Проверяет пользователя по никнейму и паролю.
   * @param {string} nickname - Никнейм пользователя.
   * @param {string} password - Пароль пользователя.
   * @returns {Promise<User | null>} - Объект пользователя или null, если пользователь не найден или пароль неверный.
   */
  async validateUser(nickname: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOne({ nickname });
    if (user && (await argon2.verify(user.password, password))) {
      return user;
    }
    return null;
  }

  /**
   * Пользовательная сессия входа.
   * @param {User} user - Объект пользователя.
   * @returns {Promise<PairKey>} - Объект с ключами доступа и обновления.
   */
  async login(user: User): Promise<PairKey> {
    return await this.generatePairKey(user.id);
  }

  /**
   * Регистрирует нового пользователя.
   * @param {Object} data - Данные нового пользователя.
   * @param {string} data.firstName - Имя пользователя.
   * @param {string} data.lastName - Фамилия пользователя.
   * @param {string} data.nickname - Никнейм пользователя.
   * @param {string} data.password - Пароль пользователя.
   * @returns {Promise<User>} - Объект пользователя.
   */
  async register(data: {
    firstName: string;
    lastName: string;
    nickname: string;
    password: string;
  }): Promise<User> {
    return await this.usersService.create(data);
  }

  /**
   * Генерирует пару ключей.
   * @param {number} userId - Идентификатор пользователя.
   * @returns {Promise<PairKey>} - Объект с токенами доступа и обновления.
   */
  async generatePairKey(userId: number): Promise<PairKey> {
    const payload = { sub: userId };

    const refreshToken = await this.refreshTokensRepository.create({
      data: { user: { connect: { id: userId } }, token: uuidv4() },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: refreshToken.token,
    };
  }
}
