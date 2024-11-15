var bot = BotManager.getCurrentBot();

const mentions = {};
const nicknames = [];
const blank = '​'.repeat(500);

function onMessage(msg)
{
    try
    {
        var message = msg.content;
        var sender = msg.author.name;

        if (!nicknames.includes(sender))
            nicknames.push(sender);

        if (Object.keys(mentions).includes(sender))
        {
            const contents = mentions[sender].map((e, v) =>
            {
                return [e.sender + (hasFinalConsonant(sender) ? '' : '이') + '의 메시지 (' + Math.floor((Date.now() - e.time) / 1000) + '초 전에)', e.content].join('\n');
            });

            msg.reply([sender + (hasFinalConsonant(sender) ? '아 ' : '야 ') + contents.length + '개 멘션이 왔어', '', '전체보기를 눌러 확인해봐 ⤵︎​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​', blank, contents.join('\n\n')].join('\n'));

            delete mentions[sender];
        }

        if (/@.+/.test(message))
        {
            const users = nicknames.filter(e => message.includes('@' + e));

            if (users.length === 0)
                return;

            const mention = 
            {
                sender: sender,
                time: Date.now(),
                content: message
            };

            users.forEach(e =>
            {
                if (e in mentions)
                {
                    mentions[e].push(mention);
                }
                else
                {
                    mentions[e] = [mention];
                }
            });

            msg.reply([sender + (hasFinalConsonant(sender) ? '이 ' : '가 ') + users.join(', ') + (hasFinalConsonant(users.join(', ')) ? '을' : '를') + ' 멘션 했어! 오면 전달 해줄께!'].join('\n'));
        }
    }
    catch (e)
    {
        Log.error("onMessage :" + e);
    }
}

function hasFinalConsonant(str)
{
    if (!str) 
        return false;
    
    const lastCharCode = str.charCodeAt(str.length - 1);

    return (lastCharCode - 44032) % 28;
};

bot.addListener(Event.MESSAGE, onMessage);
