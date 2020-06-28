import { Router } from 'express'
import { getCustomRepository } from 'typeorm'
import fs from 'fs'
import multer from 'multer'
import csvParse from 'csv-parse'

import TransactionsRepository from '../repositories/TransactionsRepository'
import CreateTransactionService from '../services/CreateTransactionService'
import DeleteTransactionService from '../services/DeleteTransactionService'
import ImportTransactionsService from '../services/ImportTransactionsService'
import { write } from 'fs/promises'

const upload = multer({ storage: multer.memoryStorage() })

const transactionsRouter = Router()

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository)
  const balance = await transactionsRepository.getBalance()
  const transactions = await transactionsRepository.find({
    relations: ['category']
  })

  return response.json({
    transactions,
    balance
  })

})

transactionsRouter.post('/', async (request, response) => {
  let { title, category, type, value } = request.body

  const createTransactionService = new CreateTransactionService()

  const transaction = await createTransactionService.execute({
    title,
    category,
    type,
    value
  })

  return response.json(transaction)
})

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params

  const deleteTransactionService = new DeleteTransactionService()

  await deleteTransactionService.execute({
    transaction_id: id
  })

  return response.status(204).send()
})

transactionsRouter.post('/import', upload.single('file'), async (request, response) => {
  const rawCsvString = request.file.buffer.toString()

  const importTransactions = new ImportTransactionsService()

  const transactions = await importTransactions.execute(rawCsvString)

  return response.json(transactions)
})

export default transactionsRouter
