import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { type ClientGrpc } from '@nestjs/microservices';
import { catchError, map, Observable, of, tap } from 'rxjs';
import {
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  AuthTokenPayload,
  Role,
} from '../types';

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private authService: AuthServiceClient;

  constructor(
    @Inject(AUTH_SERVICE_NAME) private readonly grpc: ClientGrpc,
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  onModuleInit() {
    this.authService =
      this.grpc.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const jwt =
      context.switchToHttp().getRequest().cookies?.Authentication ||
      context.switchToHttp().getRequest().headers?.authentication;

    if (!jwt) {
      return false;
    }

    const roles = this.reflector.get<Role[]>('roles', context.getHandler());

    return this.authService
      .authenticate({
        token: jwt,
      })
      .pipe(
        tap(({ token }) => {
          const { user } = this.jwtService.decode<AuthTokenPayload>(token);
          if (roles) {
            for (const role of roles) {
              if (!user.roles?.includes(role)) {
                this.logger.error('The user does not have valid roles.');
                throw new UnauthorizedException();
              }
            }
          }
          context.switchToHttp().getRequest().user = user;
        }),
        map(() => true),
        catchError((err) => {
          this.logger.error(err);
          return of(false);
        }),
      );
  }
}