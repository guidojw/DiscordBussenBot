import Sentry from '@sentry/node'
import { Intents } from 'discord.js'
import dotenv from 'dotenv'

import { Client } from './src/structures/Client'
dotenv.config()

const client = new Client({
    intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS],
})

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        release: process.env.BUILD_HASH,
    })
}

client.login(process.env.TOKEN)
