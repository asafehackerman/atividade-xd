import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'papels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('nome')
      table.datetime('created_at').notNullable()
      table.datetime('updated_at').notNullable()

    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}