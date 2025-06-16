# 🏗️ Arquitectura - Turnity Backend
---
Documentación de la arquitectura del sistema basada en **Clean Architecture** y **Domain-Driven Design**.

# 📋 Índice
---

- [Visión General](#-visión-general)
- [Principios Arquitectónicos](#-principios-arquitectónicos)
- [Estructura de Módulos](#-estructura-de-módulos)
- [Flujo de Datos](#-flujo-de-datos)
- [Capas del Sistema](#-capas-del-sistema)
- [Inyección de Dependencias](#-inyección-de-dependencias)
- [Patrones Utilizados](#-patrones-utilizados)



# 🎯 Visión General
---

Turnity Backend implementa una **arquitectura hexagonal** (Clean Architecture) que prioriza:

- **Separación de responsabilidades** por capas
- **Independencia de frameworks** y librerías externas
- **Testabilidad** en todas las capas
- **Mantenibilidad** y escalabilidad del código
- **Inversión de dependencias** hacia el dominio

```
┌─────────────────────────────────────────────────┐
│                EXTERNAL WORLD                   │
│  (Database, APIs, File System, HTTP Requests)  │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           INFRASTRUCTURE LAYER                  │
│    (Adapters, Repositories, External Services) │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│            APPLICATION LAYER                    │
│         (Use Cases, Application Services)       │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              DOMAIN LAYER                       │
│        (Entities, Business Rules, Interfaces)   │
└─────────────────▲───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│            PRESENTATION LAYER                   │
│      (Controllers, Routes, DTOs, Middleware)    │
└─────────────────────────────────────────────────┘
```



# ⚖️ Principios Arquitectónicos
---

### 1. **Dependency Rule**
Las dependencias **siempre apuntan hacia adentro**, hacia las capas de mayor nivel de abstracción.

```typescript
// ✅ CORRECTO: Application → Domain
class LoginUser {
  constructor(private userRepository: UserRepository) {} // Interface del domain
}

// ❌ INCORRECTO: Domain → Infrastructure
class User {
  constructor(private prismaClient: PrismaClient) {} // Dependencia externa
}
```

### 2. **Single Responsibility Principle**
Cada clase tiene una única responsabilidad.

```typescript
// ✅ Una responsabilidad: registrar usuarios
class RegisterUser {
  async execute(dto: RegisterDto): Promise<UserDto> {}
}

// ✅ Una responsabilidad: validar datos
class UserValidator {
  validateEmail(email: string): boolean {}
}
```

### 3. **Open/Closed Principle**
Abierto para extensión, cerrado para modificación.

```typescript
// ✅ Extensible sin modificar código existente
interface NotificationService {
  send(message: string): Promise<void>;
}

class EmailNotificationService implements NotificationService {}
class SMSNotificationService implements NotificationService {}
```



# 📦 Estructura de Módulos
---

Cada módulo sigue la misma estructura estándar:

```
src/modules/[module-name]/
├── presentation/          # Capa de Presentación
│   ├── controllers/       # Controladores HTTP
│   ├── routes/            # Definición de rutas
│   ├── middleware/        # Middleware específico

├── application/           # Capa de Aplicación
│   └── dto/               # Data Transfer Objects
│   |   ├── request/       # DTOs de entrada
│   |   └── response/      # DTOs de salida
│   ├── use-cases/         # Casos de uso del negocio
│   └── services/          # Servicios de aplicación
├── domain/                # Capa de Dominio
│   ├── entities/          # Entidades del dominio
│   ├── repositories/      # Interfaces de repositorios
│   └── services/          # Servicios de dominio
├── infrastructure/       # Capa de Infraestructura
│   ├── persistence/       # Implementaciones de repositorios
│   ├── services/          # Implementaciones de servicios
└── container.ts           # Inyección de dependencias
```

### Ejemplo: Módulo Auth

```
src/modules/auth/
├── presentation/
│   ├── controllers/AuthController.ts
│   ├── routes/AuthRoutes.ts
│   ├── middleware/AuthMiddleware.ts
│   └── dto/
│       ├── request/LoginDto.ts
│       └── response/UserDto.ts
├── application/
│   ├── use-cases/LoginUser.ts
│   └── services/AuthService.ts
├── domain/
│   ├── entities/User.ts
│   └── repositories/UserRepository.ts
├── infrastructure/
│   ├── persistence/PrismaUserRepository.ts
│   └── services/JwtTokenService.ts
└── container.ts
```



# 🔄 Flujo de Datos
---

### Request Flow (Entrada):
```
HTTP Request → Routes → Controller → Use Case → Domain Service → Repository → Database
```

### Response Flow (Salida):
```
Database → Repository → Domain Entity → Use Case → Controller → DTO → HTTP Response
```

### Ejemplo Práctico - Login de Usuario:

```typescript
// 1. PRESENTATION: Route recibe request
app.post('/auth/login', authController.login);

// 2. PRESENTATION: Controller valida y delega
class AuthController {
  async login(req: Request, res: Response) {
    const result = await this.loginUser.execute(req.body);
    res.json({ success: true, data: result });
  }
}

// 3. APPLICATION: Use Case ejecuta lógica de negocio
class LoginUser {
  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    // Validaciones y lógica...
    return new LoginResponseDto(user, token);
  }
}

// 4. INFRASTRUCTURE: Repository accede a datos
class PrismaUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({ where: { email } });
    return userData ? User.fromPersistence(userData) : null;
  }
}
```



# 🏛️ Capas del Sistema
---

### 1. **Presentation Layer** 🌐
**Responsabilidad:** Manejar comunicación HTTP y transformar datos.

```typescript
// Controllers - Orquestación de requests
class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const dto = new RegisterDto(req.body);
    const result = await this.registerUser.execute(dto);
    res.status(201).json({ success: true, data: result });
  }
}

// DTOs - Contratos de datos
class RegisterDto {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly password: string
  ) {}
}
```

### 2. **Application Layer** ⚙️
**Responsabilidad:** Casos de uso y orquestación de la lógica de negocio.

```typescript
// Use Cases - Flujos de negocio específicos
class RegisterUser {
  async execute(dto: RegisterDto): Promise<UserDto> {
    // 1. Validar datos de entrada
    await this.validateRegisterDto(dto);
    
    // 2. Verificar que el email no existe
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) throw new ConflictError('Email already exists');
    
    // 3. Crear nueva entidad
    const hashedPassword = await this.hashService.hash(dto.password);
    const user = User.create(dto.name, dto.email, hashedPassword);
    
    // 4. Persistir
    const savedUser = await this.userRepository.save(user);
    
    return UserDto.fromEntity(savedUser);
  }
}
```

### 3. **Domain Layer** 💎
**Responsabilidad:** Lógica de negocio pura y reglas del dominio.

```typescript
// Entities - Objetos con identidad y comportamiento
class User {
  constructor(
    private readonly _id: string,
    private _name: string,
    private _email: string,
    private _password: string,
    private _isActive: boolean = true
  ) {}

  // Factory method
  static create(name: string, email: string, password: string): User {
    const id = generateUUID();
    return new User(id, name, email, password);
  }

  // Business logic
  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  updateProfile(name: string): void {
    if (!name.trim()) {
      throw new Error('User name cannot be empty');
    }
    this._name = name;
  }

  // Getters
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get isActive(): boolean { return this._isActive; }
}

// Repository Interfaces - Contratos de persistencia
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
```

### 4. **Infrastructure Layer** 🔧
**Responsabilidad:** Implementaciones técnicas y adaptadores externos.

```typescript
// Repository Implementations
class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({ where: { id } });
    return userData ? this.toDomain(userData) : null;
  }

  private toDomain(data: any): User {
    return new User(data.id, data.name, data.email, data.password, data.isActive);
  }
}

// Service Implementations
class JwtTokenService implements JwtService {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  }
}
```



## 🧰 Inyección de Dependencias
---

Cada módulo tiene un **container** que configura todas las dependencias:

```typescript
// container.ts
export class AuthContainer {
  // Repositories
  private userRepository = new PrismaUserRepository(prisma);
  private roleRepository = new PrismaRoleRepository(prisma);

  // Services
  private jwtService = new JwtTokenService();
  private hashService = new BcryptHashService();

  // Use Cases
  private loginUser = new LoginUser(this.userRepository, this.hashService, this.jwtService);
  private registerUser = new RegisterUser(this.userRepository, this.roleRepository, this.hashService);

  // Controllers
  public authController = new AuthController(
    this.loginUser,
    this.registerUser,
    this.refreshToken,
    this.getUserProfile,
    this.updateUserProfile,
    this.changeUserPassword
  );
}
```



# 🎨 Patrones Utilizados
---

### 1. **Repository Pattern**
Abstrae el acceso a datos del dominio.

```typescript
interface UserRepository {
  save(user: User): Promise<User>;
}

class PrismaUserRepository implements UserRepository {
  async save(user: User): Promise<User> {
    // Implementación específica de Prisma
  }
}
```

### 2. **Factory Pattern**
Centraliza la creación de objetos complejos.

```typescript
class User {
  static create(name: string, email: string): User {
    const id = generateUUID();
    const createdAt = new Date();
    return new User(id, name, email, createdAt);
  }
}
```

### 3. **Strategy Pattern**
Permite intercambiar algoritmos dinámicamente.

```typescript
interface HashService {
  hash(password: string): Promise<string>;
}

class BcryptHashService implements HashService {}
class ArgonHashService implements HashService {}
```

### 4. **Use Case Pattern**
Encapsula la lógica de negocio en casos de uso específicos.

```typescript
class LoginUser {
  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    // Lógica específica del caso de uso de login
  }
}
```



## 📊 Beneficios de esta Arquitectura
---

### ✅ **Mantenibilidad**
- Código organizado y predecible
- Cambios aislados por capas
- Fácil localización de bugs

### ✅ **Testabilidad**
- Cada capa se puede testear independientemente
- Mocks fáciles gracias a las interfaces
- Tests rápidos sin dependencias externas

### ✅ **Escalabilidad**
- Agregar nuevos módulos sin afectar existentes
- Cambiar implementaciones sin tocar lógica de negocio
- Facilita el trabajo en equipo

### ✅ **Flexibilidad**
- Cambiar de base de datos sin afectar el dominio
- Intercambiar librerías externas fácilmente
- Adaptar a nuevos requerimientos sin reescribir



## 🔗 Referencias
---

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)