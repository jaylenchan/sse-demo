import { Controller, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthGuard } from './auth.guard';

@Controller()
export class AppController {
  constructor() {}

  @Sse('stream')
  @UseGuards(AuthGuard)
  stream() {
    return new Observable((observer) => {
      observer.next({ data: { msg: '第一次流推送' } });

      setTimeout(() => {
        observer.next({ data: { msg: '第二次流推送' } });
      }, 3000);

      setTimeout(() => {
        observer.next({ data: { msg: '第三次流推送' } });
      }, 6000);
    });
  }
}
