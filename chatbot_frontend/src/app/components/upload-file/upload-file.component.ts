import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { RagChatbotService } from '../../services/ragchatbot.service';
import { Subscription } from 'rxjs';

export interface ApiFile {
  file_id: number;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  selected?: boolean;
}

@Component({
  selector: 'app-upload-file',
  standalone: false,
  templateUrl: './upload-file.component.html',
  styleUrl: './upload-file.component.scss'
})

export class UploadFileComponent {
  busy?: Subscription;
  _subscriptionsList: Array<Subscription> = [];  
  supportedFormatsText: string = 'Supported formats: pdf, docx, txt';
  files: File[] = []; 
  draggedHeaderIndex: number | null = null;
  apiFiles: ApiFile[] = [];
  selectedFiles: File[] = []; 
  isUploading: boolean = false;
  showModal: boolean = false;
  currentPage: number = 1;
  pageSize: number = 5;
  step = 1;
  selectedFileIds: number[] = [];
  projectsList: { project_id: number, project_name: string, created_at: string, file_names: string[] }[] = [];
  projectCount: number = 0;
  newProjectName: string = '';
  selectedProjectId: number | null = null;
  isLoading: boolean = false;
  isAuthenticated = false;
  showProjectModal: boolean = false;
  nextStepDisabled: boolean = false;
  currentProject: { project_id: number, project_name: string, file_names: string[] } | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  tableHeaders = [
    { key: 'select', label: 'Select' },
    { key: 'name', label: 'File Name' },
    { key: 'type', label: 'File Type' },
    { key: 'uploadedAt', label: 'Uploaded At' },
    { key: 'delete', label: 'Delete' }
  ];

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private ragChatbotService: RagChatbotService
  ) {}

  ngOnInit() {
    this.isAuthenticated = !!localStorage.getItem('access_token');
    if (this.isAuthenticated) {
      this.getfiles();
      setTimeout(() => {
        this.getprojects();
      }, 1000);
    }
  }

  ngOnDestroy() {
    this._subscriptionsList.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  // API Call
  uploadFiles() {
    if (this.selectedFiles.length === 0) return;
    this.isUploading = true;
    this.ragChatbotService.uploadFiles(this.selectedFiles).subscribe({
      next: (response) => {
        this.files = [...this.files, ...this.selectedFiles];
        this.notificationService.pop('success', 'Files uploaded successfully');
        this.isUploading = false;
        this.showModal = false;
        this.selectedFiles = [];
        this.getfiles();
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.notificationService.pop('error', 'File upload failed. Please try again.');
        this.isUploading = false;
        this.showModal = false;
        this.selectedFiles = [];
      }
    });
  }

  getfiles() {
    this.ragChatbotService.getFiles().subscribe({
      next: (response) => {
        this.apiFiles = response.files || [];
      },
      error: (error) => {
        console.error('Failed to retrieve files:', error);
        this.notificationService.pop('error', 'Failed to retrieve files. Please try again.');
      }
    });
  }

  deleteFile(file: ApiFile) {
  if (!file.file_id) return;
  this.ragChatbotService.deleteFile(file.file_id).subscribe({
      next: () => {
        this.notificationService.pop('success', 'File deleted successfully');
        this.apiFiles = this.apiFiles.filter(f => f.file_id !== file.file_id);

        // Calculate the new total pages
        const newTotalPages = Math.ceil(this.apiFiles.length / this.pageSize) || 1;

        // If current page is now empty and not the first page, go to previous page
        const startIdx = (this.currentPage - 1) * this.pageSize;
        if (this.currentPage > 1 && startIdx >= this.apiFiles.length) {
          this.currentPage--;
        }
        this.getfiles();
      },
      error: (error) => {
        console.error('Delete failed:', error);
        this.notificationService.pop('error', 'Failed to delete file. Please try again.');
      }
    });
  }

  getprojects() {
    this.ragChatbotService.getProjects().subscribe({
      next: (response) => {
        this.projectsList = (response.projects || []).map((proj: any) => ({
          project_id: proj.project_id,
          project_name: proj.project_name,
          created_at: proj.created_at,
          file_names: proj.file_names
        }));
        this.projectCount = response.count || 0;
      },
      error: (error) => {
        console.error('Failed to retrieve projects:', error);
        this.notificationService.pop('error', 'Failed to retrieve projects. Please try again.');
      }
    }); 
  }

  confirmProjectAction() {
    if (this.busy) return;
    if (this.selectedFileIds.length > 0) {
      if (!this.newProjectName.trim()) {
        this.notificationService.pop('error', 'Please enter a project name.');
        return;
      }
      this.isLoading = true;
      this.busy = this.ragChatbotService.createProject(this.newProjectName, this.selectedFileIds).subscribe({
        next: (response) => {
          this.notificationService.pop('success', 'Project created successfully!');
          this.apiFiles.forEach(file => file.selected = false);
          this.selectedFileIds = [];
          this.newProjectName = '';
          this.step = 1;
          this.busy = undefined;
          this.router.navigate(['/chat-message'], { queryParams: { project_id: response.project_id } });
        },
        error: (error) => {
          this.isLoading = false;
          let msg = 'Failed to create project. Please try again.';
          if (error?.error?.detail) msg = error.error.detail;
          else if (error?.error?.message) msg = error.error.message;
          this.notificationService.pop('error', msg);
          this.busy = undefined;
        }
      });
    } else if (this.selectedProjectId) {
      this.isLoading = true;
      this.busy = this.ragChatbotService.joinProject(this.selectedProjectId).subscribe({
        next: (response) => {
          this.notificationService.pop('success', 'Joined project successfully!');
          this.selectedProjectId = null;
          this.step = 1;
          this.busy = undefined;
          this.router.navigate(['/chat-message'], { queryParams: { project_id: response.project_id } });
        },
        error: (error) => {
          this.isLoading = false;
          let msg = 'Failed to join project. Please try again.';
          if (error?.error?.detail) msg = error.error.detail;
          else if (error?.error?.message) msg = error.error.message;
          this.notificationService.pop('error', msg);
          this.busy = undefined;
        }
      });
    } else {
      this.notificationService.pop('error', 'Please select a project or files.');
    }
  }

  deleteProject(projectId: number) {
    this.ragChatbotService.deleteProject(projectId).subscribe({
      next: () => {
        this.notificationService.pop('success', 'Project deleted successfully');
        this.projectsList = this.projectsList.filter(p => p.project_id !== projectId);
        this.projectCount = this.projectsList.length;
        if (this.selectedProjectId === projectId) {
          this.selectedProjectId = null;
          this.step = 2; 
        }
      },
      error: (error) => {
        console.error('Delete project failed:', error);
        this.notificationService.pop('error', 'Failed to delete project. Please try again.');
      } 
    });
  }

  // File Handling logic
  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      this.handleFiles(droppedFiles);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileSelect(event: any) {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      this.handleFiles(selectedFiles);
    }
  }

  isDuplicate(file: File): boolean {
    return (
      this.files.some(existingFile => existingFile.name === file.name) ||
      this.selectedFiles.some(existingFile => existingFile.name === file.name) ||
      this.apiFiles.some(existingFile => existingFile.file_name === file.name)
    );
  }

  isValidFileType(file: File): boolean {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(fileExtension);
  }

  handleFiles(fileList: FileList) {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    const duplicateFiles: string[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Check for duplicate files
      if (this.isDuplicate(file)) {
        duplicateFiles.push(file.name);
        continue;
      }
      
      // Check for valid file type
      if (this.isValidFileType(file)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    }

    // Show notification for unsupported formats
    if (invalidFiles.length > 0) {
      const fileList = invalidFiles.join(', ');
      this.notificationService.pop('error', `Unsupported format: ${fileList}. ${this.supportedFormatsText}`);
    }
    
    // Show notification for duplicates
    if (duplicateFiles.length > 0) {
      const fileList = duplicateFiles.join(', ');
      this.notificationService.pop('error', `Duplicate files: ${fileList}. These files already exist.`);
    }

    // If we have valid files, show the modal
    if (validFiles.length > 0) {
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
      this.showModal = true;
    }

    // Reset the file input
    this.fileInput.nativeElement.value = '';
  }

  triggerFileSelect() {
    this.fileInput.nativeElement.click();
  }

  removeSelectedFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  // Modal handling
  closeModal() {
    this.showModal = false;
    this.selectedFiles = [];
  }

  openProjectModal() {
    if (this.selectedFileIds.length === 0) {
      this.notificationService.pop('error', 'Please select files to create a project.');
      return;
    }
    this.showProjectModal = true;
    this.newProjectName = '';
  }

  closeProjectModal() {
    this.showProjectModal = false;
    this.newProjectName = '';
  }

  createProjectFromModal() {
    if (!this.newProjectName || !this.newProjectName.trim()) {
      this.notificationService.pop('error', 'Please enter a project name before creating the project.');
      return;
    }
    this.showProjectModal = false;
    this.nextStepDisabled = true;
    this.currentProject = {
      project_id: 0,
      project_name: this.newProjectName,
      file_names: this.apiFiles
        .filter(f => this.selectedFileIds.includes(f.file_id))
        .map(f => f.file_name)
    };
    this.step = 3;
  }

  // Drag and drop functionality for table headers
  onHeaderDragStart(event: DragEvent, index: number) {
    this.draggedHeaderIndex = index;
  }

  onHeaderDragOver(event: DragEvent, index: number) {
    event.preventDefault();
  }

  onHeaderDrop(event: DragEvent, index: number) {
    event.preventDefault();
    if (this.draggedHeaderIndex === null || this.draggedHeaderIndex === index) return;
    const moved = this.tableHeaders.splice(this.draggedHeaderIndex, 1)[0];
    this.tableHeaders.splice(index, 0, moved);
    this.draggedHeaderIndex = null;
  }

  // Pagination logic
  get totalPages(): number {
    return Math.ceil(this.apiFiles.length / this.pageSize) || 1;
  }

  goToPreviousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  goToFirstPage() { 
    this.currentPage = 1; 
  }

  goToLastPage() { 
    this.currentPage = this.totalPages; 
  }

  goToPage(page: number) { 
    this.currentPage = page; 
  }
  
  // Step navigation logic
  goToPreviousStep() {
    if (this.step === 2) {
      this.selectedProjectId = null;
      this.selectedFileIds = [];
      this.apiFiles.forEach(f => f.selected = false);
      this.newProjectName = '';
      this.nextStepDisabled = false;
    } else if (this.step === 3) {
      if (this.selectedProjectId) {
        this.selectedFileIds = [];
        this.apiFiles.forEach(f => f.selected = false);
        this.newProjectName = '';
        this.nextStepDisabled = false;
        this.currentProject = null;
      }
    }
    if (this.step > 1) {
      this.step--;
    }
  }

  goToNextStep() {
    if (this.step === 1) {
      if (this.projectCount === 0 && this.selectedFileIds.length === 0) {
        this.notificationService.pop('error', 'No existing project allocated to the user. Please select files to proceed.');
        return;
      }
      this.step++;
    } else if (this.step === 2) {
      if (!this.selectedProjectId && this.selectedFileIds.length === 0) {
        this.notificationService.pop('error', 'Please select a project or select files to create a new project to proceed.');
        return;
      }
      if (this.selectedProjectId) {
        const proj = this.projectsList.find(p => p.project_id === this.selectedProjectId);
        this.currentProject = proj ? { ...proj } : null;
      } else if (this.selectedFileIds.length > 0) {
        this.currentProject = {
          project_id: 0,
          project_name: this.newProjectName,
          file_names: this.apiFiles
            .filter(f => this.selectedFileIds.includes(f.file_id))
            .map(f => f.file_name)
        };
      }
      this.step++;
    } else {
      this.step++;
    }
  }

  goTowikiChat() {
    this.router.navigate(['/wiki-chat']);
  }

  // Checkbox handling for projects and files
  onProjectCheckboxChange(projectId: number, event: Event) {
    if ((event.target as HTMLInputElement).checked) {
      if (this.selectedFileIds.length > 0) {
        this.notificationService.pop(
          'warning',
          'Selecting a project will ignore the selected files and join the chosen project instead.'
        );
      }
      this.selectedProjectId = projectId;
      this.nextStepDisabled = false;
    } else {
      this.selectedProjectId = null;
      // Disable next if no files are selected for new project
      this.nextStepDisabled = this.selectedFileIds.length === 0;
    }
  }

  onFileCheckboxChange(file: ApiFile, event: Event) {
    if ((event.target as HTMLInputElement).checked) {
      if (this.selectedFileIds.length >= 3) {
        this.notificationService.pop('error', 'You can select a maximum of 3 files for a project.');
        (event.target as HTMLInputElement).checked = false;
        return;
      }
      if (!this.selectedFileIds.includes(file.file_id)) {
        this.selectedFileIds.push(file.file_id);
      }
    } else {
      this.selectedFileIds = this.selectedFileIds.filter(id => id !== file.file_id);
    }
    // Disable next if neither project nor files are selected
    this.nextStepDisabled = !this.selectedProjectId && this.selectedFileIds.length === 0;
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    this.router.navigate([''], { replaceUrl: true });
  }

}