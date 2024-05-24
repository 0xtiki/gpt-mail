import { ISendMailOptions } from '@nestjs-modules/mailer';

export interface ICreateResponseParams {
  prompt: string;
  mailOptions: ISendMailOptions;
}
