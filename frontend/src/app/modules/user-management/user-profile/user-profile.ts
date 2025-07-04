import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { apiRouters } from '../../../core/constants/apiRouters';
import { UserService } from '../../../core/services/user';
import { User } from '../../../shared/interfaces/user';
import { DecodedToken } from '../../../shared/interfaces/auth';

@Component({
  selector: 'app-user-profile',
  standalone: false,
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss'
})
export class UserProfileComponent implements OnInit {
  profileForm: FormGroup;
  userData: User | null = null;
  isLoading = true;
  isSaving = false;
  alertMessage = '';
  alertType: 'success' | 'danger' | 'warning' = 'success';
  showAlert = false;
  isChangingPassword = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  createForm(): FormGroup {
    return this.fb.group({
      document: ['', [Validators.required, Validators.pattern(/^[0-9]*$/)]],
      fullname: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      confirmPassword: [''],
      role: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: AbstractControl): { [key: string]: boolean } | null {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;

    if (password || confirmPassword) {
      return password === confirmPassword ? null : { mismatch: true };
    }
    return null;
  }

  loadUserData(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        this.userService.obtenerUsuarioPorId(decoded.id).subscribe({
          next: (user: User) => {
            this.userData = user;
            this.populateForm(user);
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error al cargar datos del usuario:', err);
            this.showAlertMessage('Error al cargar datos del perfil', 'danger');
            this.isLoading = false;
          }
        });
      } catch (error) {
        console.error('Error decodificando token:', error);
        this.showAlertMessage('Error de autenticación', 'danger');
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  populateForm(user: User): void {
    this.profileForm.patchValue({
      document: user.document,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      role: user.role
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.userData) {
      this.showAlertMessage('Por favor complete el formulario correctamente', 'warning');
      return;
    }

    this.isSaving = true;
    const formData = this.profileForm.value;
    
    // Verificar si estamos cambiando la contraseña
    this.isChangingPassword = !!formData.password;

    if (this.isChangingPassword) {
      this.updatePassword(formData);
    } else {
      this.updateUserProfile(formData);
    }
  }

  private updateUserProfile(formData: any): void {
    const userData: Partial<User> = {
      document: formData.document,
      fullname: formData.fullname,
      username: formData.username,
      email: formData.email,
      role: formData.role
    };

    this.userService.actualizarUsuario(this.userData!._id || '', userData).subscribe({
      next: (updatedUser) => {
        this.handleUpdateSuccess(updatedUser);
      },
      error: (err) => {
        this.handleUpdateError(err);
      }
    });
  }

  private updatePassword(formData: any): void {
    const token = this.authService.getToken();
    if (!token) {
      this.showAlertMessage('Error de autenticación', 'danger');
      this.isSaving = false;
      return;
    }

    this.authService.resetPassword(token, formData.password).subscribe({
      next: () => {
        // Si la contraseña se actualizó correctamente, actualizar el resto del perfil
        const userData: Partial<User> = {
          document: formData.document,
          fullname: formData.fullname,
          username: formData.username,
          email: formData.email,
          role: formData.role
        };

        this.userService.actualizarUsuario(this.userData!._id || '', userData).subscribe({
          next: (updatedUser) => {
            this.handleUpdateSuccess(updatedUser);
          },
          error: (err) => {
            this.handleUpdateError(err);
          }
        });
      },
      error: (err) => {
        console.error('Error al actualizar contraseña:', err);
        this.showAlertMessage('Error al actualizar la contraseña', 'danger');
        this.isSaving = false;
      }
    });
  }

  private handleUpdateSuccess(updatedUser: User): void {
    this.userData = updatedUser;
    this.showAlertMessage('Perfil actualizado exitosamente', 'success');
    this.isSaving = false;
    
    // Actualizar datos en localStorage si es el usuario actual
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        if (decoded.id === updatedUser._id) {
          // Actualizar solo los datos básicos en localStorage
          const currentUserData = this.authService.getUserData();
          if (currentUserData) {
            localStorage.setItem('user', JSON.stringify({
              ...currentUserData,
              email: updatedUser.email,
              username: updatedUser.username,
              roles: [updatedUser.role]
            }));
          }
          
          // Si se cambió la contraseña, forzar nuevo login?
          if (this.isChangingPassword) {
            this.showAlertMessage('Perfil actualizado. Por favor inicie sesión nuevamente.', 'success');
            setTimeout(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error actualizando localStorage:', error);
      }
    }
  }

  private handleUpdateError(err: any): void {
    console.error('Error al actualizar perfil:', err);
    this.showAlertMessage('Error al actualizar el perfil', 'danger');
    this.isSaving = false;
  }

  showAlertMessage(message: string, type: 'success' | 'danger' | 'warning'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 5000);
  }

  // Helper para acceder fácilmente a los controles del formulario
  get f(): { [key: string]: AbstractControl } {
    return this.profileForm.controls;
  }
}