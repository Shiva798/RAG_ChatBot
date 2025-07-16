import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { UploadFileComponent } from './components/upload-file/upload-file.component';
import { ChatMessageComponent } from './components/chat-message/chat-message.component';
import { WikiChatComponent } from './components/wiki-chat/wiki-chat.component';

const routes: Routes = [
  {path:'',component:LoginComponent},
  {path:'upload',component:UploadFileComponent},
  {path: 'chat-message', component: ChatMessageComponent},
  {path: 'wiki-chat', component: WikiChatComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
