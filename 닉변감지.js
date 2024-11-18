var bot = BotManager.getCurrentBot();
var sdcardPath = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();
var userHashPaths = sdcardPath + '/userHashs.json';
var fs = FileStream;
var offset = 1000 * 60 * 60 * 1;
 
function today()
{
  //day 추가
  var date = new Date((new Date()).getTime() + offset);

  //getMonth ZeroBase 보정
  return String(date.getFullYear()) + '/' + String(date.getMonth() + 1) + '/' + String(date.getDate());
}
 
//현재 시간
function time()
{
  var date = new Date((new Date()).getTime() + offset);
  
  return String(date.getHours()) + '시 ' + String(date.getMinutes()) + '분 ' + String(date.getSeconds()) + '초';
}
 
function onMessage(msg)
{
  try
  {

    var userHash = msg.author.hash;
    var currentName = msg.author.name;
    var roomName = msg.room;
    var roomId = msg.channelId.toString().substring(0, 10);
    
    if (userHash)
    {
      var userHashList = JSON.parse(fs.read(userHashPaths));

      if (!userHashList.find(n => n.userHash === userHash))
      {
        userHashList.push(
        {
            'userHash': userHash,
            'userName': currentName,
            'date': today() + ' ' + time(),
            'count': 0
        });
      }
      else
      {
        var idx = userHashList.findIndex(n => n.userHash === userHash);

        if (userHashList[idx].userName !== currentName)
        {
          var returnMessage = "닉네임 변경을 감지! \n" + userHashList[idx].userName + " -> " + currentName + '\n 기존 닉네임 감지 시간 : ' + userHashList[idx].date;

          if (userHashList[idx].count > 1)
            returnMessage += "\n닉네임 변경 : " + userHashList[idx].count + "회";

          if (userHashList[idx].comment)
            returnMessage += "\n코멘트 : " + userHashList[idx].comment;

          if (bot.canReply("운영진방"))
            bot.send("운영진방", returnMessage);
          else
            msg.reply(returnMessage);

          userHashList[idx].userName = currentName;
          userHashList[idx].date = today() + ' ' + time();

          if (userHashList[idx].count < 1)
            userHashList[idx]['count'] = 0;
          else  
            userHashList[idx].count += 1;
        }
      }

      fs.write(userHashPaths, JSON.stringify(userHashList));
    }
  }
  catch (e)
  {
      Log.error("onMessage :" + e);
  }
}
 
function onCommand(msg)
{
  try
  {
    var message = msg.content;
    var command = msg.command;

    if (message.includes("코멘트") && message.includes("저장"))
    {
      var name = message.replace(".코멘트", "").split("저장")[0].trim();

      if (!name)
        return;

      var body = message.replace(".코멘트", "").replace(name, "").replace("저장", "").trim();
      var userHashList = JSON.parse(fs.read(userHashPaths));
      var idx = userHashList.findIndex(n => n.userName === name);

      if (idx > -1)
      {
        userHashList[idx]['comment'] = body;

        fs.write(userHashPaths, JSON.stringify(userHashList));

        msg.reply(name + "의 코멘트 저장 완료");
      }
    }
  }
  catch (e)
  {
      Log.error("onCommand :" + e);
  }
}
 
bot.addListener(Event.MESSAGE, onMessage);
bot.addListener(Event.COMMAND, onCommand);
bot.setCommandPrefix(".");
