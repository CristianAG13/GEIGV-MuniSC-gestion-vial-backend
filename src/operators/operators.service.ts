import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operator } from './entities/operator.entity';
import { User } from '../users/entities/user.entity';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(Operator)
    private operatorsRepository: Repository<Operator>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createOperatorDto: CreateOperatorDto): Promise<Operator> {
    // Verificar si ya existe un operador con la misma identificación
    const existingOperator = await this.operatorsRepository.findOne({
      where: { identification: createOperatorDto.identification }
    });

    if (existingOperator) {
      throw new BadRequestException(`Ya existe un operador con la identificación ${createOperatorDto.identification}`);
    }

    // Si se proporciona un userId, verificar que el usuario existe
    if (createOperatorDto.userId) {
      const user = await this.userRepository.findOne({
        where: { id: createOperatorDto.userId }
      });

      if (!user) {
        throw new NotFoundException(`No se encontró un usuario con el ID ${createOperatorDto.userId}`);
      }

      // Verificar si el usuario ya está asociado a otro operador
      const operatorWithUser = await this.operatorsRepository.findOne({
        where: { userId: createOperatorDto.userId }
      });

      if (operatorWithUser) {
        throw new BadRequestException(`El usuario con ID ${createOperatorDto.userId} ya está asociado a otro operador`);
      }
    }

    const operator = this.operatorsRepository.create(createOperatorDto);
    return this.operatorsRepository.save(operator);
  }

  async findAll(): Promise<Operator[]> {
    return this.operatorsRepository.find({
      relations: ['user']
    });
  }

  async findOne(id: number): Promise<Operator> {
    const operator = await this.operatorsRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!operator) {
      throw new NotFoundException(`No se encontró un operador con el ID ${id}`);
    }

    return operator;
  }

  async update(id: number, updateOperatorDto: UpdateOperatorDto): Promise<Operator> {
    const operator = await this.operatorsRepository.findOne({
      where: { id }
    });

    if (!operator) {
      throw new NotFoundException(`No se encontró un operador con el ID ${id}`);
    }

    // Si se quiere actualizar la identificación, verificar que no exista otro operador con esa identificación
    if (updateOperatorDto.identification && updateOperatorDto.identification !== operator.identification) {
      const existingOperator = await this.operatorsRepository.findOne({
        where: { identification: updateOperatorDto.identification }
      });

      if (existingOperator && existingOperator.id !== id) {
        throw new BadRequestException(`Ya existe un operador con la identificación ${updateOperatorDto.identification}`);
      }
    }

    // Si se quiere actualizar el userId, verificar que el usuario existe
    if (updateOperatorDto.userId) {
      const user = await this.userRepository.findOne({
        where: { id: updateOperatorDto.userId }
      });

      if (!user) {
        throw new NotFoundException(`No se encontró un usuario con el ID ${updateOperatorDto.userId}`);
      }

      // Verificar si el usuario ya está asociado a otro operador
      const operatorWithUser = await this.operatorsRepository.findOne({
        where: { userId: updateOperatorDto.userId }
      });

      if (operatorWithUser && operatorWithUser.id !== id) {
        throw new BadRequestException(`El usuario con ID ${updateOperatorDto.userId} ya está asociado a otro operador`);
      }
    }

    await this.operatorsRepository.update(id, updateOperatorDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const operator = await this.operatorsRepository.findOne({
      where: { id }
    });

    if (!operator) {
      throw new NotFoundException(`No se encontró un operador con el ID ${id}`);
    }

    await this.operatorsRepository.delete(id);
  }

  async getOperatorWithUserDetails(id: number): Promise<any> {
    const operator = await this.operatorsRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!operator) {
      throw new NotFoundException(`No se encontró un operador con el ID ${id}`);
    }

    // Crear un objeto con los datos del operador y el email del usuario si existe
    const result = {
      ...operator,
      email: operator.user ? operator.user.email : null
    };

    return result;
  }

  async findByIdentification(identification: string): Promise<Operator> {
    const operator = await this.operatorsRepository.findOne({
      where: { identification },
      relations: ['user']
    });

    if (!operator) {
      throw new NotFoundException(`No se encontró un operador con la identificación ${identification}`);
    }

    return operator;
  }

  async associateWithUser(id: number, userId: number): Promise<Operator> {
    const operator = await this.operatorsRepository.findOne({
      where: { id }
    });

    if (!operator) {
      throw new NotFoundException(`No se encontró un operador con el ID ${id}`);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`No se encontró un usuario con el ID ${userId}`);
    }

    // Verificar si el usuario ya está asociado a otro operador
    const operatorWithUser = await this.operatorsRepository.findOne({
      where: { userId }
    });

    if (operatorWithUser && operatorWithUser.id !== id) {
      throw new BadRequestException(`El usuario con ID ${userId} ya está asociado a otro operador`);
    }

    operator.userId = userId;
    await this.operatorsRepository.save(operator);

    return this.findOne(id);
  }

  async removeUserAssociation(id: number): Promise<Operator> {
    const operator = await this.operatorsRepository.findOne({
      where: { id }
    });

    if (!operator) {
      throw new NotFoundException(`No se encontró un operador con el ID ${id}`);
    }

    operator.userId = null;
    await this.operatorsRepository.save(operator);

    return this.findOne(id);
  }
}
