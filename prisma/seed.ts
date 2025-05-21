import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { addDays, subDays, addHours, format, setHours, setMinutes, parseISO } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando el sembrado de la base de datos...');

  // Limpiar datos existentes

  console.log('🧹 Limpiando datos existentes...');
  await prisma.payment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationStatus.deleteMany();
  await prisma.scheduleException.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.appointmentStatus.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.stylist.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.schedule.deleteMany();

  //Creación de  roles

  const adminRole = await prisma.role.create({
    data: {
      name: RoleName.ADMIN,
      description: 'Administrador del sistema con acceso completo',
    },
  });

  const clientRole = await prisma.role.create({
    data: {
      name: RoleName.CLIENT,
      description: 'Cliente que puede agendar citas',
    },
  });

  const stylistRole = await prisma.role.create({
    data: {
      name: RoleName.STYLIST,
      description: 'Estilista que ofrece servicios',
    },
  });

  // Creación de  usuarios

  console.log('👤 Creando usuarios...');
  // Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Usuario',
      email: 'admin@turnity.com',
      phone: '123456789',
      password: adminPassword,
      roleId: adminRole.id,
      profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
  });

  // Clientes
  const clientPassword = await bcrypt.hash('client123', 10);
  const client1 = await prisma.user.create({
    data: {
      name: 'María García',
      email: 'maria@example.com',
      phone: '612345678',
      password: clientPassword,
      roleId: clientRole.id,
      profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg',
      client: {
        create: {
          preferences: 'Prefiere citas por la tarde, le gusta el estilo moderno',
        },
      },
    },
    include: {
      client: true,
    },
  });

  const client2 = await prisma.user.create({
    data: {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '623456789',
      password: clientPassword,
      roleId: clientRole.id,
      profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg',
      client: {
        create: {
          preferences: 'Prefiere citas por la mañana, estilo clásico',
        },
      },
    },
    include: {
      client: true,
    },
  });

  // Estilistas
  const stylistPassword = await bcrypt.hash('stylist123', 10);
  const stylist1 = await prisma.user.create({
    data: {
      name: 'Lucía Rodríguez',
      email: 'lucia@turnity.com',
      phone: '634567890',
      password: stylistPassword,
      roleId: stylistRole.id,
      profilePicture: 'https://randomuser.me/api/portraits/women/4.jpg',
      stylist: {
        create: {},
      },
    },
    include: {
      stylist: true,
    },
  });

  const stylist2 = await prisma.user.create({
    data: {
      name: 'Carlos Sánchez',
      email: 'carlos@turnity.com',
      phone: '645678901',
      password: stylistPassword,
      roleId: stylistRole.id,
      profilePicture: 'https://randomuser.me/api/portraits/men/5.jpg',
      stylist: {
        create: {},
      },
    },
    include: {
      stylist: true,
    },
  });

  // Creación de categorías de servicios

  console.log('🏷️ Creando categorías de servicios...');
  const hairCategory = await prisma.category.create({
    data: {
      name: 'Cabello',
      description: 'Servicios relacionados con el cabello',
    },
  });

  const facialCategory = await prisma.category.create({
    data: {
      name: 'Facial',
      description: 'Servicios para el cuidado facial',
    },
  });

  const nailsCategory = await prisma.category.create({
    data: {
      name: 'Uñas',
      description: 'Servicios de manicura y pedicura',
    },
  });

  // Creación de servicios

  console.log('💇 Creando servicios...');
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Corte de cabello',
        description: 'Corte y estilo según preferencias',
        duration: 30,
        durationVariation: 15,
        price: 25.0,
        categoryId: hairCategory.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Tinte de cabello',
        description: 'Coloración completa',
        duration: 90,
        durationVariation: 30,
        price: 60.0,
        categoryId: hairCategory.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Tratamiento facial',
        description: 'Limpieza e hidratación facial',
        duration: 45,
        durationVariation: 15,
        price: 40.0,
        categoryId: facialCategory.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Manicura',
        description: 'Cuidado y pintado de uñas',
        duration: 45,
        durationVariation: 15,
        price: 20.0,
        categoryId: nailsCategory.id,
      },
    }),
  ]);

  // Asignación de servicios a estilistas

  console.log('🔄 Asignando servicios a estilistas...');
  await prisma.stylist.update({
    where: { id: stylist1.stylist!.id },
    data: {
      services: {
        connect: [
          { id: services[0].id }, // Corte
          { id: services[1].id }, // Tinte
          { id: services[2].id }, // Facial
        ],
      },
    },
  });

  await prisma.stylist.update({
    where: { id: stylist2.stylist!.id },
    data: {
      services: {
        connect: [
          { id: services[0].id }, // Corte
          { id: services[3].id }, // Manicura
        ],
      },
    },
  });

  // Creación de estados de citas

  console.log('📋 Creando estados de citas...');
  const pendingStatus = await prisma.appointmentStatus.create({
    data: {
      name: 'Pendiente',
      description: 'Cita agendada pero pendiente de confirmación',
    },
  });

  const confirmedStatus = await prisma.appointmentStatus.create({
    data: {
      name: 'Confirmada',
      description: 'Cita confirmada',
    },
  });

  const completedStatus = await prisma.appointmentStatus.create({
    data: {
      name: 'Completada',
      description: 'Cita realizada con éxito',
    },
  });

  const cancelledStatus = await prisma.appointmentStatus.create({
    data: {
      name: 'Cancelada',
      description: 'Cita cancelada',
    },
  });

  // Creación de horarios

  console.log('🕒 Creando horarios...');
  const schedules = await Promise.all([
    prisma.schedule.create({
      data: {
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '18:00',
      },
    }),
    prisma.schedule.create({
      data: {
        dayOfWeek: 'TUESDAY',
        startTime: '09:00',
        endTime: '18:00',
      },
    }),
    prisma.schedule.create({
      data: {
        dayOfWeek: 'WEDNESDAY',
        startTime: '09:00',
        endTime: '18:00',
      },
    }),
    prisma.schedule.create({
      data: {
        dayOfWeek: 'THURSDAY',
        startTime: '09:00',
        endTime: '18:00',
      },
    }),
    prisma.schedule.create({
      data: {
        dayOfWeek: 'FRIDAY',
        startTime: '09:00',
        endTime: '18:00',
      },
    }),
    prisma.schedule.create({
      data: {
        dayOfWeek: 'SATURDAY',
        startTime: '10:00',
        endTime: '14:00',
      },
    }),
  ]);

  // Creación de días festivos usando date-fns

  console.log('🎉 Creando días festivos...');

  // Navidad 2025
  const christmasDate = new Date(2025, 11, 25); // Fecha en JavaScript (mes es 0-indexado)
  const christmasHoliday = await prisma.holiday.create({
    data: {
      name: 'Navidad',
      date: christmasDate,
      description: 'Cerrado por Navidad',
    },
  });

  // Año Nuevo 2026
  const newYearDate = new Date(2026, 0, 1);
  const newYearHoliday = await prisma.holiday.create({
    data: {
      name: 'Año Nuevo',
      date: newYearDate,
      description: 'Cerrado por Año Nuevo',
    },
  });

  // Creación de excepciones de horario usando date-fns
  console.log('⚠️ Creando excepciones de horario...');

  // Nochebuena 2025
  const christmasEveDate = new Date(2025, 11, 24);
  await prisma.scheduleException.create({
    data: {
      holidayId: christmasHoliday.id,
      exceptionDate: christmasEveDate,
      startTimeException: '09:00',
      endTimeException: '14:00',
      reason: 'Horario reducido en Nochebuena',
    },
  });

  // Creación de estados de notificaciones

  console.log('🔔 Creando estados de notificaciones...');
  const pendingNotifStatus = await prisma.notificationStatus.create({
    data: {
      name: 'Pendiente',
      description: 'Notificación pendiente de envío',
    },
  });

  const sentNotifStatus = await prisma.notificationStatus.create({
    data: {
      name: 'Enviada',
      description: 'Notificación enviada exitosamente',
    },
  });

  const failedNotifStatus = await prisma.notificationStatus.create({
    data: {
      name: 'Fallida',
      description: 'Error al enviar la notificación',
    },
  });

  // Creación de citas de ejemplo usando date-fns
  console.log('📅 Creando citas de ejemplo...');

  // Fecha actual
  const today = new Date();

  // Cita futura: 7 días desde hoy a las 10:00 AM
  const futureDate = addDays(today, 7);
  const futureDateAt10 = setMinutes(setHours(futureDate, 10), 0); // Establece hora a las 10:00 AM

  const appointment1 = await prisma.appointment.create({
    data: {
      userId: client1.id,
      clientId: client1.client!.id,
      stylistId: stylist1.stylist!.id,
      statusId: confirmedStatus.id,
      scheduleId: schedules[0].id,
      dateTime: futureDateAt10,
      duration: 45,
      confirmedAt: new Date(), // La confirmación ocurre ahora
      services: {
        connect: [{ id: services[0].id }], // Corte de cabello
      },
    },
  });

  // Cita pasada: 7 días atrás a las 15:00
  const pastDate = subDays(today, 7);
  const pastDateAt15 = setMinutes(setHours(pastDate, 15), 0); // Establece hora a las 15:00

  const appointment2 = await prisma.appointment.create({
    data: {
      userId: client2.id,
      clientId: client2.client!.id,
      stylistId: stylist2.stylist!.id,
      statusId: completedStatus.id,
      scheduleId: schedules[2].id,
      dateTime: pastDateAt15,
      duration: 60,
      confirmedAt: subDays(pastDateAt15, 1), // Confirmada 1 día antes
      services: {
        connect: [
          { id: services[0].id }, // Corte
          { id: services[3].id }, // Manicura
        ],
      },
    },
  });

  // Creación de pagos usando date-fns
  console.log('💰 Creando pagos...');
  await prisma.payment.create({
    data: {
      appointmentId: appointment2.id,
      amount: 45.0, // Suma de corte + manicura
      status: 'COMPLETED',
      method: 'CREDIT_CARD',
      paymentDate: addHours(pastDateAt15, 1), // 1 hora después de la cita
    },
  });

  // Creación de notificaciones usando date-fns
  console.log('📩 Creando notificaciones...');
  await prisma.notification.create({
    data: {
      userId: client1.id,
      statusId: sentNotifStatus.id,
      type: 'APPOINTMENT_CONFIRMATION',
      message: `Tu cita para el ${format(futureDateAt10, 'dd/MM/yyyy')} a las ${format(futureDateAt10, 'HH:mm')} ha sido confirmada.`,
      sentAt: new Date(), // Enviada ahora
    },
  });

  // Notificación de recordatorio para cita futura (programada para enviarse 1 día antes)
  const reminderDate = subDays(futureDateAt10, 1);
  await prisma.notification.create({
    data: {
      userId: client1.id,
      statusId: pendingNotifStatus.id,
      type: 'APPOINTMENT_REMINDER',
      message: `Recordatorio: Tienes una cita mañana ${format(futureDateAt10, 'dd/MM/yyyy')} a las ${format(futureDateAt10, 'HH:mm')}.`,
      sentAt: null, // Aún no enviada
    },
  });

  // Notificación de cita completada
  await prisma.notification.create({
    data: {
      userId: client2.id,
      statusId: sentNotifStatus.id,
      type: 'APPOINTMENT_CONFIRMATION',
      message: `¡Gracias por visitarnos! Tu cita del ${format(pastDateAt15, 'dd/MM/yyyy')} ha sido completada exitosamente.`,
      sentAt: addHours(pastDateAt15, 2), // 2 horas después de la cita
    },
  });

  console.log('✅ Sembrado completado con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el sembrado:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Cerrar la conexión del cliente de Prisma
    await prisma.$disconnect();
  });
