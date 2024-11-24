var scriptName = '닉변 감지 봇';
var bot = BotManager.getCurrentBot();
var sdcardPath = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();
var userHashPaths = sdcardPath + '/userHashNew.json';
var userHashBackUpPaths = sdcardPath + '/userHashBackUp.json';
var chatCountPath = sdcardPath + '/chatCountList.json';
var attendancePath = sdcardPath + '/attendanceList.json';
var fs = FileStream;
var offset = 1000 * 60 * 60 * 1;
var itRoomId = "1843311789";
var mainRoomId = "1843374958";
var mainRoomName = "메인방";
var adminRoomId = "1843176468";
var adminRoomName = "운영진방";
 
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

//파일 체크
function fileCheck(path)
{
    if (!fs.read(path))
        fs.write(path, JSON.stringify([]));
}
 
function onMessage(msg)
{
	try
	{
		var userHash = msg.author.hash;
		var currentName = msg.author.name;
		var roomId = msg.channelId.toString().substring(0, 10);

		if (roomId === mainRoomId || roomId === "0")
		{
			fileCheck(userHashPaths);
			var userHashList = JSON.parse(fs.read(userHashPaths));

			var idx = userHashList.findIndex(n => n.userHash === userHash);

			if (idx > -1)
			{
				if (userHashList[idx].userName !== currentName)
				{
					var returnMessage = "닉네임 변경을 감지! \n" + userHashList[idx].userName + " -> " + currentName + '\n 기존 닉네임 감지 시간 : ' + userHashList[idx].date;

					if (userHashList[idx].count > 1)
						returnMessage += "\n닉네임 변경 : " + userHashList[idx].count + "회";

					if (userHashList[idx].comment)
						returnMessage += "\n코멘트 : " + userHashList[idx].comment;

					if (bot.canReply(adminRoomName))
						bot.send(adminRoomName, returnMessage);
					else
						msg.reply(returnMessage);

					userHashList[idx].userName = currentName;
					userHashList[idx].date = today() + ' ' + time();
					userHashList[idx].count += 1;
				}
			}
			else
			{
				userHashList.push(
				{
					'userHash': userHash,
					'userName': currentName,
					'date': today() + ' ' + time(),
					'count': 0
				});
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
		else if (command === "파일")
		{
			var userHashRawFile = fs.read(userHashPaths);

			msg.reply(userHashRawFile);
		}
		else if (command === "파일백업")
		{
			var userHashRawList = JSON.parse(fs.read(userHashPaths));
			fs.write(userHashBackUpPaths, JSON.stringify(userHashRawList));

			msg.reply("파일 백업 완료");
		}
		else if (command === "파일복원")
		{
			var userHashRawBackUpList = JSON.parse(fs.read(userHashBackUpPaths));
			fs.write(userHashPaths, JSON.stringify(userHashRawBackUpList));

			msg.reply("파일 복원 완료");
		}
		else if (command === "출석부데이터")
		{
			var userHashList = JSON.parse(fs.read(userHashPaths));
			var attendanceList = JSON.parse(fs.read(attendancePath));
			var processHashCount = 0;

			attendanceList.forEach(e =>
			{
				var idx = userHashList.findIndex(c => c.userHash === e.userHash);

				if (idx < 0)
				{
					userHashList.push(
					{
						'userHash': e.userHash,
						'userName': e.name,
						'date': '알수없는 먼 옛날에',
						'count': 0
					});

					processHashCount++;
				}

			});

			fs.write(userHashPaths, JSON.stringify(userHashList));

			msg.reply("추가된 유저 해시 수 : " + processHashCount + "개");
		}
		else if (command === "채팅순위데이터")
		{
			var userHashs = JSON.parse(fs.read(userHashPaths));
			var charCountList = JSON.parse(fs.read(chatCountPath));
			var processDataCount = 0;

			charCountList.forEach(e =>
			{
				var idx = userHashs.findIndex(c => c.userHash === e.userHash);

				if (idx < 0)
				{
					userHashs.push(
					{
						'userHash': e.userHash,
						'userName': e.name,
						'date': '알수없는 먼 옛날에',
						'count': 0
					});

					processDataCount++;
				}

			});

			fs.write(userHashPaths, JSON.stringify(userHashs));

			msg.reply("추가된 유저 해시 수 : " + processDataCount + "개");
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
