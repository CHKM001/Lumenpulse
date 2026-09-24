import { Module } from '@nestjs/common';
import { BotAuthService } from './bot-auth.service';
import { BotCommandMapperService } from './bot-command-mapper.service';
import { BotPrincipalService } from './bot-principal.service';

@Module({
  providers: [BotAuthService, BotCommandMapperService, BotPrincipalService],
  exports: [BotAuthService, BotCommandMapperService, BotPrincipalService],
})
export class BotAuthModule {}
