import OpenAI from 'openai';
const client = new OpenAI({ apiKey: 'test' });
client.chat.completions.create({
  model: 'test',
  messages: [{role: 'user', content: 'test'}],
}, {
  body: { chat_template_kwargs: {} }
});
