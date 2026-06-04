import { ImportedSetlist, MatchTracksRequest, ResolvedTrack, ScrapeSetlistsRequest } from '@metal-p3/setlist-importer/domain';
import { Body, Controller, Post } from '@nestjs/common';
import { SetlistImporterService } from './setlist-importer.service';

@Controller('setlist-importer')
export class SetlistImporterController {
  constructor(private readonly service: SetlistImporterService) {}

  @Post('scrape')
  scrape(@Body() body: ScrapeSetlistsRequest): Promise<ImportedSetlist[]> {
    return this.service.scrape(body);
  }

  @Post('match')
  match(@Body() body: MatchTracksRequest): Promise<ResolvedTrack[]> {
    return this.service.match(body);
  }
}
