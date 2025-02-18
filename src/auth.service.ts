import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async signIn({
    id,
    name,
  }: {
    id: string;
    name: string;
  }): Promise<{ access_token: string }> {
    const payload = { sub: id, username: name };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
