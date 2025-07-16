import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { UploadFileComponent } from './components/upload-file/upload-file.component';
import { NotificationComponent } from './components/notification/notification.component';
import { GridModule } from '@syncfusion/ej2-angular-grids';
import { HttpClientModule } from '@angular/common/http';
import { ChatMessageComponent } from './components/chat-message/chat-message.component';
import { WikiChatComponent } from './components/wiki-chat/wiki-chat.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    UploadFileComponent,
    NotificationComponent,
    ChatMessageComponent,
    WikiChatComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule,
    GridModule,
    HttpClientModule
  ],
  providers: [
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
