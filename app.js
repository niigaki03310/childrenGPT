'use strict';

require("dotenv").config();
const express = require('express');
const axios = require('axios');
const line = require('@line/bot-sdk');
const PORT = process.env.PORT || 3000;

const config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.get('/', (req, res) => res.send('Hello LINE BOT!(GET)')); //ブラウザ確認用(無くても問題ない)
app.post('/webhook', line.middleware(config), (req, res) => {
    console.log(req.body.events[0].message.text);

    const lineMes = req.body.events[0].message.text;

    const client = new line.Client(config);

    async function handleEvent(event) {
        if (event.type !== 'message' || event.message.type !== 'text') {
            return Promise.resolve(null);
        }

        const openai = new OpenAIApi(configuration);

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: lineMes  }],
        });
     
        const res = completion.data.choices[0].message.content;

        return client.replyMessage(event.replyToken, 
            {
              type: 'text',
              text:  res
            }
        );
    }

    Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

app.listen(PORT);
console.log(`Server running at ${PORT}`);