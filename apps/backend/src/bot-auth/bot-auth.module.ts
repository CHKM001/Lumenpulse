import { Module } from '@nestjs/common';
import { BotAuthService } from './bot-auth.service';
import { BotCommandMapperService } from './bot-command-mapper.service';

import { BotPrincipalService } from './bot-principal.service';

@Module({
  providers: [BotAuthService, BotCommandMapperService, BotPrincipalService],
  exports: [BotAuthService, BotCommandMapperService, BotPrincipalService],

import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [BotAuthService, BotCommandMapperService],
  exports: [BotAuthService, BotCommandMapperService],

})
export class BotAuthModule {}
