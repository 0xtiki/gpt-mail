import { IncomingMessageDto, IncomingMessageNotificationDto } from '@app/dtos';

export interface IGptServiceInput {
  message: IncomingMessageNotificationDto | IncomingMessageDto;
  thread: any;
}
