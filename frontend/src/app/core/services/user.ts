import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { AuthService } from './auth';
import { User } from '../../shared/interfaces/user';
import { apiRouters } from '../constants/apiRouters';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { UserData } from '../../shared/interfaces/auth';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private apiService: ApiService,
    private authService: AuthService // Inyecta AuthService
  ) { 
    console.log('UserService inicializado');
  }

  // Crear un nuevo usuario (solo admin/coordinador)
  crearUsuario(userData: User): Observable<any> {
    console.log('Creando usuario con datos:', userData);
    
    // Validar rol
    const rolesPermitidos = ['admin', 'coordinador', 'lider'];
    if (!rolesPermitidos.includes(userData.role)) {
      console.error('Rol no válido:', userData.role);
      throw new Error('Rol no válido. Los roles permitidos son: admin, coordinador, lider');
    }

    return this.apiService.postObservable(apiRouters.USERS.BASE, userData).pipe(
      tap((response: any) => {
        console.log('Usuario creado exitosamente:', response);
      }),
      catchError(error => {
        console.error('Error al crear usuario:', error);
        return throwError(() => error);
      })
    );
  }

  // Obtener todos los usuarios (solo admin/coordinador)
  obtenerTodosUsuarios(): Observable<User[]> {
    console.log('Obteniendo todos los usuarios');
    return this.apiService.getObservable(apiRouters.USERS.BASE).pipe(
      tap((usuarios: User[]) => {
        console.log('Usuarios obtenidos exitosamente:', usuarios.length);
      }),
      catchError(error => {
        console.error('Error al obtener usuarios:', error);
        return throwError(() => error);
      })
    );
  }

  // Modifica este método para incluir el token
  obtenerUsuarioPorId(id: string): Observable<User> {
    console.log('Obteniendo usuario con ID:', id);
    
    // Obtén el token
    const token = this.authService.getToken();
    console.log('Token actual:', token); // Debug: verifica que el token existe
    
    if (!token) {
      console.error('Error: No hay token disponible');
      return throwError(() => new Error('No hay token disponible'));
    }

    // Configura los headers correctamente
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Debug: muestra los headers que se enviarán
    console.log('Headers configurados:', headers);

    // return this.apiService.getObservable(apiRouters.USERS.BY_ID(id), {
    //   headers: headers
    // }).pipe(
    //   tap((usuario: User) => {
    //     console.log('Usuario obtenido exitosamente:', usuario);
    //   }),
    //   catchError(error => {
    //     console.error(`Error al obtener usuario con ID ${id}:`, error);
    //     return throwError(() => error);
    //   })
  //   );
   }

  // Actualizar usuario (usuarios autenticados)
  actualizarUsuario(id: string, userData: Partial<User>): Observable<User> {
    console.log('Actualizando usuario con ID:', id, 'Datos:', userData);
    
    // Si se actualiza el rol, validarlo
    if (userData.role) {
      const rolesPermitidos = ['admin', 'coordinador', 'lider'];
      if (!rolesPermitidos.includes(userData.role)) {
        console.error('Rol no válido:', userData.role);
        throw new Error('Rol no válido. Los roles permitidos son: admin, coordinador, lider');
      }
    }

    return this.apiService.putObservable(apiRouters.USERS.BY_ID(id), userData).pipe(
      tap((usuarioActualizado: User) => {
        console.log('Usuario actualizado exitosamente:', usuarioActualizado);
        
        // Si se actualiza el usuario actual, actualizar localStorage
        const usuarioActual = this.obtenerUsuarioActual();
        if (usuarioActual && usuarioActual._id === id) {
          const datosActualizados = {
            ...usuarioActual,
            ...userData
          };
          localStorage.setItem('user', JSON.stringify(datosActualizados));
          console.log('Datos locales del usuario actualizados');
        }
      }),
      catchError(error => {
        console.error(`Error al actualizar usuario con ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  // Eliminar usuario (solo admin)
  eliminarUsuario(id: string): Observable<any> {
    console.log('Eliminando usuario con ID:', id);
    return this.apiService.deleteObservable(apiRouters.USERS.BY_ID(id)).pipe(
      tap(() => {
        console.log('Usuario eliminado exitosamente');
      }),
      catchError(error => {
        console.error(`Error al eliminar usuario con ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  // Métodos auxiliares
  private obtenerUsuarioActual(): UserData | null {
    const usuario = localStorage.getItem('user');
    const usuarioParseado = usuario ? JSON.parse(usuario) : null;
    console.log('Obteniendo datos del usuario actual:', usuarioParseado);
    return usuarioParseado;
  }

  // Verificar si el usuario actual tiene permisos de administrador
  esAdmin(): boolean {
    const roles = this.obtenerUsuarioActual()?.roles || [];
    const esAdmin = roles.includes('admin');
    console.log('Verificando si el usuario es admin:', esAdmin);
    return esAdmin;
  }

  // Verificar si el usuario actual tiene permisos de coordinador
  esCoordinador(): boolean {
    const roles = this.obtenerUsuarioActual()?.roles || [];
    const esCoordinador = roles.includes('coordinador');
    console.log('Verificando si el usuario es coordinador:', esCoordinador);
    return esCoordinador;
  }

  // Verificar si el usuario actual tiene permisos de líder
  esLider(): boolean {
    const roles = this.obtenerUsuarioActual()?.roles || [];
    const esLider = roles.includes('lider');
    console.log('Verificando si el usuario es líder:', esLider);
    return esLider;
  }
}