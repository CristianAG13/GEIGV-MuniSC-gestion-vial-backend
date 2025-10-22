import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { InitializationService } from './initialization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('system')
export class SystemController {
  constructor(private readonly initializationService: InitializationService) {}

  @Post('initialize')
  async initialize() {
    return await this.initializationService.reinitialize();
  }

  @Get('status')
  async getStatus() {
    return await this.initializationService.getSystemStatus();
  }

  @Post('ensure-roles')
  @UseGuards(JwtAuthGuard)
  async ensureRoles() {
    return await this.initializationService.reinitialize();
  }
}