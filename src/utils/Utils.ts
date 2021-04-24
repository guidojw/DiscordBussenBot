import { Message } from 'discord.js'

const Fuse = require(`fuse.js`)

export function getPrompt(channel, filter): any {
    const collector = channel.createMessageCollector(filter, { max: 1 })

    return {
        message: new Promise((resolve, reject) => {
            collector.on('end', collected => {
                if (collected.size === 0) {
                    reject(new Error(`Collector stopped`))
                    return
                }

                resolve(collected.first() as Message)
            })
        }),
        collector,
    }
}

export async function getBinaryReactions(message, maxTime, options) {
    const collector = message.createReactionCollector(
        (reaction, _) => {
            const emojiName = reaction.emoji.name
            return inElementOf(options, emojiName)
        },
        { time: maxTime },
    )

    const promise = new Promise(resolve => {
        collector.on('end', collected => {
            resolve(collected)
        })
    })

    for (const option of options) {
        await message.react(option)
    }

    collector.on('collect', async (reaction, user) => {
        const newReactionName = reaction.emoji.name
        const users = reaction.users.cache
        const messageReactions = message.reactions.cache.values()

        if (inElementOf(options, newReactionName)) {
            for (const react of messageReactions) {
                const oldReactionName = react.emoji.name
                if (
                    newReactionName !== oldReactionName &&
                    inElementOf(options, oldReactionName) &&
                    users.has(user.id)
                ) {
                    await react.users.remove(user)
                }
            }
        }
    })

    return promise
}

export function inElementOf(list, query) {
    for (const option of list) {
        if (option.includes(query)) {
            return option
        }
    }
    return null
}

export function createFuse(responseOptions, numeric) {
    if (numeric) {
        const [s1, s2] = responseOptions[0].split('-')
        const [start, end] = [parseInt(s1), parseInt(s2)]
        responseOptions = [...new Array(end).keys()]
            .map(val => String(val + start))
            .join('|')
        return new RegExp(`^(${responseOptions})$`)
    }
    return new Fuse(responseOptions)
}

export function getFilter(user, checker) {
    return m => {
        let correctAnswer
        if (checker instanceof Fuse) {
            correctAnswer = checker.search(m.content).length === 1
        } else {
            correctAnswer = checker.test(m.content)
        }
        return correctAnswer && m.author.equals(user)
    }
}