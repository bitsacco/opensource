import { type Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Body, Controller, Logger, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { AuthTokenPayload, LoginUserRequestDto } from '@bitsacco/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {
    this.logger.log('AuthController initialized');
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({
    type: LoginUserRequestDto,
  })
  async login(
    @Body() req: LoginUserRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return firstValueFrom(this.authService.loginUser(req)).then(
      (authResponse) => {
        const { expires } = this.jwtService.decode<AuthTokenPayload>(
          authResponse.token,
        );

        const env = this.configService.get('NODE_ENV');
        res.cookie('Authentication', authResponse.token, {
          httpOnly: true,
          secure: env === 'production',
          expires,
        });

        return authResponse;
      },
    );
  }
}
