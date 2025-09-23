import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'matriculas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('aluno_id').unsigned().references('id').inTable('alunos').primary()
      table.integer('disciplina_id').unsigned().references('id').inTable('disciplinas').primary()
      table.datetime('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
