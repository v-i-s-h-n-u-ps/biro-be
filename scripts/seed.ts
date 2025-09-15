import { dataSource } from 'config/datasource';

import { Role } from 'src/common/constants/rbac.enum';
import {
  PermissionsList,
  RolePermissionsMap,
  RolesList,
} from 'src/rbac/constants/rbac.seed';
import { Permissions } from 'src/rbac/entities/permission.entity';
import { Roles } from 'src/rbac/entities/role.entity';
import { User } from 'src/users/entities/users.entity';

async function seed() {
  await dataSource.initialize();

  const roleRepo = dataSource.getRepository(Roles);
  const permRepo = dataSource.getRepository(Permissions);
  const userRepo = dataSource.getRepository(User);

  for (const perm of PermissionsList) {
    const exists = await permRepo.findOne({ where: { id: perm.id } });
    if (!exists) await permRepo.save(perm);
  }

  const allPerms = await permRepo.find();

  for (const role of RolesList) {
    const exists = await roleRepo.findOne({ where: { id: role.id } });
    if (!exists) {
      await roleRepo.save({
        ...role,
        permissions: allPerms.filter((p) =>
          RolePermissionsMap[role.id].includes(p.id),
        ),
      });
    }
  }

  const superUserFirebaseUid = 'firebase-super-admin-uid'; // Replace with actual Firebase UID
  let superUser = await userRepo.findOne({
    where: { firebaseUid: superUserFirebaseUid },
    relations: ['roles'],
  });

  if (!superUser) {
    const adminRole = await roleRepo.findOne({
      where: { id: Role.ADMIN },
      relations: ['permissions'],
    });

    superUser = userRepo.create({
      firebaseUid: superUserFirebaseUid,
      email: 'superadmin@example.com',
      roles: adminRole ? [adminRole] : [],
    });

    await userRepo.save(superUser);
    console.log('✅ Super user created');
  } else {
    console.log('Super user already exists');
  }

  console.log('✅ RBAC seed complete');
  await dataSource.destroy();
}

seed().catch(console.error);
