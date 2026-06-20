import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { CoverService } from './cover.service';

@Controller('cover')
export class CoverController {
  constructor(private readonly coverService: CoverService) {}

  @Get()
  get(@Query('location') location: string, @Res() res: Response): void {
    this.coverService.getCover(location).subscribe({
      next: (buffer) => res.set('Content-Type', 'image/jpeg').send(buffer),
      error: () => {
        if (!res.headersSent) res.status(204).send();
      },
      complete: () => {
        if (!res.headersSent) res.status(204).send();
      },
    });
  }

  @Get('download')
  download(@Query('url') url: string | string[], @Res() res: Response): void {
    this.coverService.downloadCover(url).subscribe({
      next: (buffer) => res.set('Content-Type', 'image/jpeg').send(buffer),
      error: () => {
        if (!res.headersSent) res.status(204).send();
      },
      complete: () => {
        if (!res.headersSent) res.status(204).send();
      },
    });
  }

  @Get('metal-archives')
  getFromMetalArchives(@Query('url') url: string, @Res() res: Response): void {
    this.coverService.getCoverFromMetalArchives(url).subscribe({
      next: (buffer) => {
        if (buffer) {
           res.set('Content-Type', 'image/jpeg').send(buffer);
        } else {
           res.status(204).send();
        }
      },
      error: () => {
        if (!res.headersSent) res.status(204).send();
      },
      complete: () => {
        if (!res.headersSent) res.status(204).send();
      },
    });
  }

  @Post()
  post(@Body() body: { folder: string; cover: string }): Promise<void> {
    return this.coverService.saveCover(body.folder, body.cover);
  }

  @Get('resize')
  resize(): Promise<void> {
    return this.coverService.resize();
  }
}
