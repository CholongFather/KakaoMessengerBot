importClass(org.jsoup.Jsoup);
importClass(org.jsoup.Connection);

var scriptName = '통합 메신저 봇';
var sdcardPath = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();
var attendancePath = sdcardPath + '/attendanceList.json';
var chatPointPath = sdcardPath + '/chatPointList.json';
var chatCountPath = sdcardPath + '/chatCountList.json';
var chatStartPath = sdcardPath + '/chatStart.json';
var personalStatementPath = sdcardPath + '/personalStatementList.json';
var zodiacFortuneTellerPath = sdcardPath + '/zodiacFortuneTeller.json';
var botData = sdcardPath + '/botData.json';
var taroCardData = sdcardPath + '/taroCard.json';
var fs = FileStream;
var bot = BotManager.getCurrentBot();
var upDownNumber = {};
var upDownMax = 1000;
//이미 띠별 운세 가져오는 중
var getFortuneTellerNow = false;
var isGetStaticFile = false;

var zodiac = [];
var geminiKey = "";
var astroLogy = {};
var nameChemistryKoreanScore = {};
var todayChatCount = [];
var todayCelebrityCount = [];
var typingGameSentence = "";
var typingGameStart = Date.now();
var isTypingGameNow = false;
var typingGameWinner = [];

var offset = 1000 * 60 * 60 * 1;
var itRoom = "1843311789";
var debugRoom = "0";
//이사가면 바꿀것...
var mainRoom = "1843374958";
var mainRoomName = "메인방";
var adminRoom = "1843176468";
var adminRoomName = "운영진방";
var botName = "막내";

//메세지 왔을 경우
function onMessage(msg)
{
	try
	{
		if (!isGetStaticFile)
			getStaticFile();

		var message = msg.content.trim();

		if (message.startsWith('.'))
			return;

		var roomId = msg.channelId.toString().substring(0, 10);
		var sender = msg.author.name;
		var userHash = msg.author.hash;
		var roomName = msg.room;

		if (roomId === debugRoom)
		{
			adminRoom = debugRoom;
			mainRoom = debugRoom;
		}

		if (roomId === mainRoom)
		{
			mainRoomName = roomName;

			if (message.includes("사진을 보냈습니다."))
				return;
			else if (message.includes("이모티콘을 보냈습니다."))
				return;
			else if (message.includes("보이스룸이 방금 시작했어요."))
				voiceRoomStart(msg, sender);
			else if (message.includes("보이스룸 종료 "))
				voiceRoomEnd(msg, sender);
			else if (message.includes("새 칭구 환영하자규"))
				newUserGreet(msg);
			else if (message.includes("vs"))
				pickVersusText(msg);
			else if (message.includes("@운영진"))
			{
				if (bot.canReply(adminRoomName))
					bot.send(adminRoomName, sender + " : " + message.replace("@운영진 ", ""));
				else
					msg.reply("지금은 " + botName + "🧖가 운영진 호출이 불가해 ⚠️");
			}
			else if (message.includes("변우석"))
			{
				var todayCelebrityIndex = todayCelebrityCount.findIndex(c => c.day === date(0));

				if (todayCelebrityIndex > -1)
					todayCelebrityCount[todayCelebrityIndex].chat += 1;
				else
				{
					todayCelebrityCount.push(
					{
						'day':date(0),
						'room':roomId,
						'chat':1
					});
				}
			}
			else
			{
				if (isTypingGameNow && typingGameSentence === message)
					winTypingGameSentence(msg, sender);

				attendance(msg, roomId, sender, userHash, date(0), date(-1), time());
				messageCount(roomId, sender, userHash, msg);
			}
		}
	}
	catch (e)
	{
		Log.error("onMessage :" + e);
	}
}

//커맨드 실행 감지 현재 .
function onCommand(msg)
{
	try
	{
		var command = msg.command;
		var args = msg.args;
		var userHash = msg.author.hash;
		var content = msg.content;
		var roomId = msg.channelId.toString().substring(0, 10);
		var roomName = msg.room;
		var sender = msg.author.name;

		if (roomId === debugRoom)
		{
			adminRoom = debugRoom;
			mainRoom = debugRoom;
		}

		switch (command)
		{
			case "출석부" : attendanceRegisterList(msg, roomId, date(0)); break;
			case "채팅" :
			case "채팅순위" : messageCountRank(roomId, msg); break;
			case "소개" : getPersonalStatement(msg, args, roomId); break;
			case "자기소개" : getSelfPersonalStatement(msg, sender); break;
			case "실검" : getSearchWord(msg); break;
			case "존대" : msg.reply("⚠️우리방에서 존대는 벌공이야. 얼공 큐!"); break;
			case "ㄷ" :
			case "동전" : coinFlipGame(msg); break;
			case "ㅈ" :
			case "주사위" : diceGame(msg, args); break;
			case "ㅇ" :
			case "업다운" : upDownGame(msg, args, sender, roomId);				
			case "별" : getAstroLogicalSign(msg, args[0]); break;
			case "ㅇㅅ" :
			case "운세" : getAllZodiacFortuneTeller(msg, args); break;
			case "ㅅㄱ" :
			case "시간" : getGlobalTimeList(msg); break;
			case "타로" : getTaroCardWithGemini(msg, userHash); break;
			case "방이름" : msg.reply("⚠️ 우리 방 이름 : " + roomName); break;
			case "방번호" : msg.reply("⚠️ 우리 방 번호 : " + roomId); break;
			case "?" :
			case "명령" : getCommandList(msg); break;
			case "이름궁합" : getNameChemistry(msg, content); break;
			case "추천" : getTodayMeal(msg, args); break;
			case "검색" : getGeminiSearch(msg); break;
			case "19금" : msg.reply("너무 야해요."); break;
			case "로또번호" : getLottoNumber(msg); break;
			case "로또당첨번호" : getWinnerLottoNumber(msg); break;
			case "변우석" : getCelebrityCount(msg); break;
			case "타자게임" : startTypingGame(msg, args); break;
		}

		if (roomId === adminRoom || roomId === itRoom)
		{
			switch (command)
			{
				case "ㄱㅈ" :
				case "공지" :
					if (bot.canReply(mainRoomName))
						bot.send(mainRoomName, content.replace(".공지 ", "").replace(".ㄱㅈ ", ""));
					break;
				case "전체포인트" : getPointList(mainRoom, msg, roomName); break;
				case "전체자소서" : getAllPersonalStatement(msg, roomName); break;
				case "?" :
				case "명령" : getAdminCommandList(msg); break;
				case "초기화": fileReset(msg, args, userHash); break;
				case "상태" :
				case "막내상태" : getPhoneStatus(msg, roomName); break;
			}
		}

		if (content.includes("자소서") && content.includes("저장"))
			savePersonalStatement(msg, content, userHash);
		else if (content.includes("자소서") && content.includes("삭제"))
			deletePersonalStatement(msg, content, userHash);
		else if (content.includes("포인트") && content.includes("사용"))
			usePoint(mainRoom, msg, userHash);
	}
	catch (e)
	{
		Log.error("onCommand :" + e);
	}
}

//도움말 목록
function getCommandList(msg)
{
	var commandList = botName + "🧖의 신나는 명령어✍️ 목록 \n -------------------------- \n";

	commandList += "실시간 검색어 : .실검\n";
	commandList += "띠별 운세 : .ㅇㅅ, .운세\n";
	commandList += "별자리 운세 : .별 (자리)\n";
	commandList += "타로 카드 : .타로\n";
	commandList += "메뉴추천 : .추천 (아침, 점심, 저녁, 양식)\n";
	commandList += "이름 궁합 : .이름궁합 (A), (B)\n";
	commandList += "현재 시간 : .ㅅㄱ .시간\n";
	commandList += "자소서 보기 : .소개 (닉네임 ex. 누구 남)\n";
	commandList += "자기 자소서 보기 : .자기소개\n";
	commandList += "채팅 순위 보기 : .채팅, .채팅순위\n";
	commandList += "출석부 보기 : .출석부\n";
	commandList += "존대 규칙 : .존대\n";
	commandList += "동전 던지기 : .ㄷ, .동전\n";
	commandList += "주사위 던지기 : .ㅈ, .주사위 (+ 숫자)\n";
	commandList += "업다운 게임 : .ㅇ 시작, .업다운 시작, .종료, .업다운 종료, .ㅇ (숫자), .업다운 (숫자)\n";
	commandList += "타자 게임 : .타자게임 (문구 길이)\n";
	commandList += "방 이름 확인 : .방이름\n";
	commandList += "검색 : .검색 (검색할 내용)\n";
	commandList += "로또 번호 : .로또번호\n";
	commandList += "로또 당첨 번호 : .로또당첨번호\n";
	commandList += "변우석 감지 : .변우석\n";
	commandList += "**운영진 호출 : @운영진 할말**";

	msg.reply(commandList);
}

function getAdminCommandList(msg)
{
	var commandList = botName + "🧖의 운영진방 명령어✍️ 목록 \n -------------------------- \n";
	commandList += "포인트 내역 : .전체포인트\n";
	commandList += "자소서 내역 : .전체자소서\n";
	commandList += "메인방 공지 : .ㄱㅈ, .공지\n";
	commandList += "막내 상태 : .상태, .막내상태";

	msg.reply(commandList);
}

//관리자 판별 함수, 방이름으로 변경 중
function checkAdmin(userHash)
{
	switch (userHash)
	{
		//디버깅 시
		case "DEBUG ROOM":
			//베리
		case "34b810178e0d1f25e8d733652dfe86218d40018bea5a9779c74f02401daaa438":
		case "3a596a81ba44989915f2a7ba06ea7f7f1a9ab05b7c284388b4be049f6a21d6c9":
			//서락 남
		case "b57042c03b7701d7bf427a6ee810f16f36d305d8024c5abb82a61875e8a8ab4e":
		case "5c2e2cd9c86c3f8b135bd81f1dfba1f66ced64843d0803a7e214b4666568de69":
		case adminRoomName:
			return true;
		default:
			return false;
	}
}

//날짜 함수
function date(day)
{
	//day 추가
	var date = new Date((new Date()).getTime() + offset);

	date.setDate(date.getDate() + day);

	//getMonth ZeroBase 보정
	return String(date.getFullYear()) + '/' + String(date.getMonth() + 1) + '/' + String(date.getDate());
}

//현재 시간
function time()
{
	var date = new Date((new Date()).getTime() + offset);
	
	return String(date.getHours()) + '시 ' + String(date.getMinutes()) + '분 ' + String(date.getSeconds()) + '초';
}

function getLocationDateTime(offset)
{
	var date = new Date((new Date()).getTime() + offset);

	return String(date.getMonth() + 1) + '-' + String(date.getDate() + ' ' + date.getHours()) + ':' + String(date.getMinutes());
}

function getTimeStampToDateTime(timestamp)
{
	var date = new Date(timestamp);
	date = new Date(date.getTime() + offset);

	return String(date.getMonth() + 1) + '-' + String(date.getDate() + ' ' + date.getHours()) + ':' + String(date.getMinutes());
}

function getTimeStampCompare(timestamp, compareDate)
{
	if (Number(timestamp) > Number(compareDate))
		return true;
	else
		return false;
}

function getStaticFile()
{
	fileCheck(botData);

	var botDataList = JSON.parse(fs.read(botData))[0];

	geminiKey = botDataList.geminiKey;
	zodiac = botDataList.zodiac;
	astroLogy = botDataList.astroLogy;
	nameChemistryKoreanScore = botDataList.nameChemistryKoreanScore;

	isGetStaticFile = true;
}

//순위에 메달 넣는
function rank(num)
{
	var emoji = '🖤';

	switch (num)
	{
		case 1: emoji = '❤️'; break;
		case 2: emoji = '🧡'; break;
		case 3: emoji = '💛'; break;
		case 4: emoji = '💚'; break;
		case 5: emoji = '💙'; break;
		case 6: emoji = '💜'; break;
		case 7: emoji = '🤍'; break;
		case 8: emoji = '💕'; break;
		case 9: emoji = '💗'; break;
		case 10: emoji = '💘'; break;
	}

	return emoji + num;
}

//파일 체크
function fileCheck(path)
{
	if (!fs.read(path))
		fs.write(path, JSON.stringify([]));
}

//맨 뒤의 Space 없애기
function trimLastSpace(text)
{
	if (!text)
		return "";

	return text.slice(0, text.length - 1);
}

//보이스룸 시작 알림
function voiceRoomStart(msg, sender)
{
	msg.reply(sender + (hasFinalConsonant(sender) ? "이" : "가") + " 🎤보이스룸 시작. 🤟");
}

//보이스룸 종료 알림
function voiceRoomEnd(msg, sender)
{
	msg.reply(sender + (hasFinalConsonant(sender) ? "이" : "가") + " 🎤보이스룸 종료. ✨");
}

//입장 감지 인사
function newUserGreet(msg)
{
	msg.reply("어서와~ ❤️");
	setTimeout(() => msg.reply("하트 ❤️, 인사 🖐️ 먼저 하고 닉변 해줘~"), 4000);
}

function hasFinalConsonant(str)
{
	if (!str) 
		return false;
	
	const lastCharCode = str.charCodeAt(str.length - 1);

	return (lastCharCode - 44032) % 28;
};

function getGlobalTimeList(msg)
{
	var timeList = "⌚현재 시간:\n -------------------------- \n";
	timeList += "🕜미국 (서부): " + getLocationDateTime(offset * -16)+ '\n';
	timeList += "🕛멕시코: " + getLocationDateTime(offset * -14)+ '\n';
	timeList += "🕐캐나다 토론토: " + getLocationDateTime(offset * -13)+ '\n';
	timeList += "🕜미국 (동부): " + getLocationDateTime(offset * -13)+ '\n';
	timeList += "🕝브라질: " + getLocationDateTime(offset * -12)+ '\n';
	timeList += "🕞영국: " + getLocationDateTime(offset * -8)+ '\n';
	timeList += "🕠포르투갈: " + getLocationDateTime(offset * -8)+ '\n';
	timeList += "🕤프랑스,네덜란드,스위스,헝가리: " + getLocationDateTime(offset * -7)+ '\n';
	timeList += "🕥우크라이나: " + getLocationDateTime(offset * -6)+ '\n';
	timeList += "🕙터키: " + getLocationDateTime(offset * -5)+ '\n';
	timeList += "🕛인도: " + getLocationDateTime(offset * -2)+ '\n';
	timeList += "🕐중국,말레이시아: " + getLocationDateTime(offset * 0)+ '\n';
	timeList += "🕑한국: " + getLocationDateTime(offset * 1)+ '\n';
	timeList += "🕒호주: " + getLocationDateTime(offset * 3);

	msg.reply(timeList);
}

//포인트 획득 함수
function earnPoint(room, msg, sender, userHash, point)
{
	fileCheck(chatPointPath);
	var chatPointList = JSON.parse(fs.read(chatPointPath));
	var chatPointIndex = chatPointList.findIndex(n => n.room === room && n.userHash === userHash);

	if (chatPointIndex > -1)
	{
		chatPointList[chatPointIndex].point += point;
		chatPointList[chatPointIndex].name = sender;
		msg.reply(sender + " 포인트🗝️ 획득 : " + point + ", 현재 포인트 : " + chatPointList[chatPointIndex].point);
	}
	else
	{
		chatPointList.push(
		{
			'room': room,
			'userHash': userHash,
			'name' : sender,
			'point': point
		});

		msg.reply(sender + " 포인트🗝️ 획득 : " + point + ", 현재 포인트 : " + point);
	}

	fs.write(chatPointPath, JSON.stringify(chatPointList));
}

function usePoint(room, msg, userHash)
{
	if (checkAdmin(userHash) == false)
		return;

	fileCheck(chatPointPath);

	var chatPointList = JSON.parse(fs.read(chatPointPath));

	var name = content.replace(".포인트", "").split("사용")[0].trim();

	if (!name)
		return;

	var point = Number(content.replace(".포인트", "").replace(name, "").replace("사용", "").trim());

	if (point < 1)
		return;

	var chatPointIndex = chatPointList.findIndex(n => n.room === room && n.name === name);

	if (chatPointIndex > -1)
	{
		var currentPoint = chatPointList[chatPointIndex].point;

		if ((currentPoint - point) > 0)
		{
			chatPointList[chatPointIndex].point -= point;
			msg.reply(chatPointList[chatPointIndex].name + "의 포인트 (" + point + ") 을 사용, 남은 포인트 : " + chatPointList[chatPointIndex].point);

			fs.write(chatPointPath, JSON.stringify(chatPointList));
		}
		else
		{
			msg.reply("포인트가 모잘라! \n현재 포인트 : " + chatPointList[chatPointIndex].point + ", 사용하고자 하는 포인트 : " + point);
		}
	}
}

function getPointList(roomId, msg, roomName)
{
	if (checkAdmin(roomName) == false)
		return;

	fileCheck(chatPointPath);

	var chatPointList = JSON.parse(fs.read(chatPointPath));
	var chatPointListByRoom = chatPointList.filter(n => n.room === roomId);
	var chatPointListByRoomReply = "전체 포인트🗝️ 리스트 : \n";

	if (chatPointListByRoom.length !== 0)
	{
		for (var i in chatPointListByRoom)
		{
			if (chatPointListByRoom[i].name)
				chatPointListByRoomReply += chatPointListByRoom[i].name + " : " + chatPointListByRoom[i].point + "\n";
		}

		msg.reply(trimLastSpace(chatPointListByRoomReply));
	}
}

//vs 선택 함수
function pickVersusText(msg)
{
	var message = msg.content;
	var array = message.split("vs");

	msg.reply(message + " 결과는 !! " + array[Math.floor(Math.random() * array.length)].trim());
}

function getPhoneStatus(msg, roomName)
{
	if (checkAdmin(roomName) == false)
		return;

	msg.reply(botName + " 배터리🔋 : " + Device.getBatteryLevel() + "%\n어제 : " + date(-1) + "\n오늘 : " + date(0) + "\n시간 : " + time());
}

function getSearchWord(msg)
{
	var searchWordUrl = "https://api.signal.bz/news/realtime";
	var searchWordResponse = Jsoup.connect(searchWordUrl).ignoreContentType(true).ignoreHttpErrors(true).get().wholeText();
	var searchWordData = JSON.parse(searchWordResponse);
	var replySearchWord = "🏅실시간 검색어 Top10" + "\n";

	for (var i in searchWordData["top10"])
	{
		replySearchWord += searchWordData["top10"][i].rank + "위 : " + searchWordData["top10"][i].keyword + "\n";
	}

	msg.reply(trimLastSpace(replySearchWord));
}

function fileReset(msg, args, userHash)
{
	if (checkAdmin(userHash) == false)
		return;

	if (args[0] == '출석부')
	{
		fs.write(attendancePath, JSON.stringify([]));
		msg.reply('🧨출석부 초기화 완료');
	}
	else if (args[0] == '자소서')
	{
		fs.write(personalStatementPath, JSON.stringify([]));
		msg.reply('🧨자소서 초기화 완료');
	}
	else if (args[0] == '채팅순위')
	{
		fs.write(chatCountPath, JSON.stringify([]));
		fs.write(chatStartPath, JSON.stringify([]));
		msg.reply('🧨채팅순위 초기화 완료');
	}
	else if (args[0] == '운세')
	{
		fs.write(zodiacFortuneTellerPath, JSON.stringify([]));
		msg.reply('🧨운세 초기화 완료');
	}
	else if (args[0] == '타로')
	{
		fs.write(taroCardData, JSON.stringify([]));
		msg.reply('🧨타로 초기화 완료');
	}
	else
	{
		msg.reply('🧨출석부, 채팅순위, 자소서, 운세, 타로 중 하나만 초기화 하고 싶어 ex .초기화 출석부');
	}
}

function attendance(msg, room, sender, userHash, today, yesterday, time)
{
	fileCheck(attendancePath);
	var attendanceList = JSON.parse(fs.read(attendancePath));

	if (attendanceList.find(n => n.day === today && n.room === room && n.userHash === userHash))
		return;

	if (attendanceList.find(n => n.day === yesterday && n.room === room && n.userHash === userHash))
	{
		var series = Number(attendanceList[attendanceList.findIndex(n => n.day === yesterday && n.room === room && n.userHash === userHash)].series) + 1;

		attendanceList.push(
		{
			'userHash': userHash,
			'name': sender,
			'day': today,
			'room': room,
			'more': time,
			'series': series
		});
	}
	else
	{
		attendanceList.push(
		{
			'userHash': userHash,
			'name': sender,
			'day': today,
			'room': room,
			'more': time,
			'series': 1
		});
	}

	fs.write(attendancePath, JSON.stringify(attendanceList));

	var i = attendanceList.filter(n => n.day === today && n.room === room).findIndex(n => n.userHash === userHash);
	var response = sender + ' 오늘 ' + (i + 1) + '번째로 출석! 🙌';

	msg.reply(response);

	earnPoint(room, msg, sender, userHash, 1);
}

function attendanceRegisterList(msg, room, today)
{
	var attendanceList = JSON.parse(fs.read(attendancePath));

	if (!attendanceList)
		return;

	var attendanceListByRoom = attendanceList.filter(n => n.room == room && n.day === today);

	if (attendanceListByRoom.length === 0)
	{
		msg.reply('오늘은 출석한 친구가 없네');
		return;
	}

	var attendanceListResponse = '🙌우리방 출석부' + ''.repeat(500) + '\n\n';

	for (n in attendanceListByRoom)
	{
		attendanceListResponse += "[" + rank(Number(n) + 1) + "] " + attendanceListByRoom[n].name + " (" + attendanceListByRoom[n].more + ") 연속 출석 : " + attendanceListByRoom[n].series + "\n";
	}

	attendanceListResponse = attendanceListResponse.slice(0, attendanceListResponse.length - 1);
	msg.reply(attendanceListResponse);
}

function messageCount(room, sender, userHash, msg)
{
	fileCheck(chatCountPath);
	var chatCountList = JSON.parse(fs.read(chatCountPath));

	fileCheck(chatStartPath);
	var chatStartDate = JSON.parse(fs.read(chatStartPath));

	var idx = chatCountList.findIndex(n => n.room === room && n.userHash === userHash);

	if (idx > -1)
	{
		chatCountList[idx].chat++;
		chatCountList[idx].sender = sender;
		chatCountList[idx].lastChat = Date.now();
	}
	else
	{
		if (chatStartPath.length == 0)
		{
			chatStartDate.push({'date': date(0) + ' ' + time()});
			fs.write(chatStartPath, JSON.stringify(chatStartDate));
		}

		if (sender.length > 5)
			msg.reply("@" + sender + " 닉변해줘 (이름) (성별)로 부탁해 💋");

		chatCountList.push(
		{
			'room': room,
			'sender': sender,
			'userHash': userHash,
			'lastChat': Date.now(),
			'chat': 1
		});
	}

	chatCountList = chatCountList.sort((a, b) => b.chat - a.chat);
	fs.write(chatCountPath, JSON.stringify(chatCountList));

	var todayChatIndex = todayChatCount.findIndex(c => c.day === date(0));

	if (todayChatIndex > -1)
	{
		var count = room === debugRoom ? 10 : 100;

		if (todayChatCount[todayChatIndex].chat % count === 0)
		{
			var message = "띠링~"+ botName +"🧖로부터 알림 도착!\n\n오늘 우리방 챗수 🗨️ " + todayChatCount[todayChatIndex].chat + "건 돌파 💯";
			
			msg.reply(message);
		}

		todayChatCount[todayChatIndex].chat += 1;
	}
	else
	{
		todayChatCount.push(
		{
			'day':date(0),
			'room':room,
			'chat':1
		});
	}
}

function messageCountRank(room, msg)
{
	var chatStart = JSON.parse(fs.read(chatStartPath));
	var chatCountList = JSON.parse(fs.read(chatCountPath));

	if (!chatCountList)
		return;

	var chatCountListByRoom = chatCountList.filter(n => n.room === room);

	if (chatCountListByRoom.length === 0)
	{
		msg.reply('채팅을 한 친구가 없네?');
		return;
	}

	var chatRankResponse = '#️⃣전체 채팅순위' + ''.repeat(500) + '\n⏰기록 시간 : ' + chatStart[0].date + '\n';
	var rankIndex = 1;

	for (n in chatCountListByRoom)
	{
		if (!chatCountListByRoom[n].lastChat)
			continue;

		if (getTimeStampCompare(chatCountListByRoom[n].lastChat, (Date.now() + (-1 * 24 * 60 * 60 * 1000))))
			chatRankResponse += '[' + rank(rankIndex++) + '] ' + chatCountListByRoom[n].sender + ' : ' + chatCountListByRoom[n].chat + ', 챗 : ' + getTimeStampToDateTime(chatCountListByRoom[n].lastChat) + '\n';
	}

	chatRankResponse = chatRankResponse.slice(0, chatRankResponse.length - 1);
	msg.reply(chatRankResponse);
}

var duplicateSavePersonalStatement = false;

function savePersonalStatement(msg, content, userHash)
{
	if (checkAdmin(userHash) == false)
		return;

	fileCheck(personalStatementPath);

	var name = content.replace(".자소서", "").split("저장")[0].trim();

	if (!name)
		return;

	var personalStatementList = JSON.parse(fs.read(personalStatementPath));
	var body = content.replace(".자소서", "").replace(name, "").replace("저장", "").trim();

	if (!personalStatementList.find(n => n.name === name))
	{
		personalStatementList.push(
		{
			'name': name,
			'content': body,
			'time': date(0) + " " + time()
		});

		msg.reply("자소서📜 저장 완료");
	}
	else
	{
		if (duplicateSavePersonalStatement === false)
		{
			msg.reply("이미 있는 자소서📜  야 덮어 씌우길 원해? 덮어씌우려면 10초안에 다시 입력 해줘");
			duplicateSavePersonalStatement = true;

			setTimeout(() => duplicateSavePersonalStatement = false, 10000);
			return;
		}

		if (duplicateSavePersonalStatement)
		{
			personalStatementList[personalStatementList.findIndex(n => n.name === name)].content = body;
			personalStatementList[personalStatementList.findIndex(n => n.name === name)].time = date(0) + " " + time();
			msg.reply("자소서📜 덮어씌우기 완료");

			duplicateSavePersonalStatement = false;
		}
	}

	fs.write(personalStatementPath, JSON.stringify(personalStatementList));
}

function deletePersonalStatement(msg, content, userHash)
{
	if (checkAdmin(userHash) == false)
		return;

	fileCheck(personalStatementPath);

	var name = content.replace(".자소서", "").split("삭제")[0].trim();

	if (!name)
		return;

	var personalStatementList = JSON.parse(fs.read(personalStatementPath));
	var i = personalStatementList.findIndex(n => n.name === name);

	if (i > -1)
		personalStatementList.splice(i, 1);

	fs.write(personalStatementPath, JSON.stringify(personalStatementList));
	msg.reply("자소서📜 삭제 완료");
}

function getPersonalStatement(msg, arg, roomId)
{
	try
	{
		fileCheck(personalStatementPath);

		var name = arg.join(' ').trim();

		if (!name)
			return;

		var personalStatementList = JSON.parse(fs.read(personalStatementPath));

		if (roomId === mainRoom)
		{
			if (name.length < 2)
			{
				msg.reply("이름이 이상혀서.. 소개를 못혀");
				return;
			}
		}

		var reply = false;

		personalStatementList.forEach(e =>
		{
			if (e.name.includes(name))
			{
				reply = true;
				wait(1);
				msg.reply("📜" + e.name + "의 자소서📜\n" + e.content + " \n⏰ 저장 시간 : " + e.time);
			}
		});

		if (reply === false)
			msg.reply("아이고! 자소서📜를 못찾겠네~");
	}
	catch (e)
	{
		msg.reply("미안~ 자소서📜가 등록되지 않은 친구네?");
		Log.info("자소서 불러오기 오류 : " + e);
	}
}

function getSelfPersonalStatement(msg, name)
{
	try
	{
		fileCheck(personalStatementPath);

		var personalStatementList = JSON.parse(fs.read(personalStatementPath));
		var i = personalStatementList.findIndex(n => n.name === name);

		msg.reply("📜" + personalStatementList[i].name + "의 자소서📜\n" + personalStatementList[i].content + " \n⏰ 저장 시간 : " + personalStatementList[i].time);
	}
	catch (e)
	{
		msg.reply("아직 나를 소개할 준비가 덜됐어. 😭");
		Log.info("자소서 불러오기 오류 : " + e);
	}
}

//전체 자소서 목록
function getAllPersonalStatement(msg, roomName)
{
	if (checkAdmin(roomName) == false)
		return;

	fileCheck(personalStatementPath);

	var personalStatementList = JSON.parse(fs.read(personalStatementPath));
	var returnpersonalStatementList = "전체 자소서📜 수 : " + personalStatementList.length + "\n";

	personalStatementList = personalStatementList.sort(function(a, b) 
	{
		return a.name - b.name;
	});

	for (var i in personalStatementList)
	{
		returnpersonalStatementList += personalStatementList[i].name  + "\n" + personalStatementList[i].content + "\n" + personalStatementList[i].time + "\n\n";
	}

	msg.reply(returnpersonalStatementList);
}

//주사위 게임
function diceGame(msg, args)
{
	var max = 6;	

	var maxInput = Number(args[0]);
	
	if (maxInput)
		max = maxInput;

	msg.reply("🎲주사위 결과 : " + (Math.floor(Math.random() * max) + 1));
}

//동전 뒤집기
function coinFlipGame(msg)
{
	var coin = ["🤚앞이", "✋뒤가"][Math.floor(Math.random() * 2)];
	msg.reply(coin + " 나왔다!");
}

//업다운 게임
function upDownGame(msg, args, sender, room)
{
	if (args[0] === "시작")
	{
		if (upDownNumber.hasOwnProperty(room))
			msg.reply("이미 업다운👆👇 게임이 진행중.");
		else
		{
			var max = upDownMax;
			upDownNumber[room] = Math.floor(Math.random() * max) + 1;
			msg.reply("업다운👆👇 게임 시작.\n범위 : 1 ~ " + max);
		}
	}
	else if (args[0] === "종료")
	{
		if (upDownNumber.hasOwnProperty(room))
		{
			msg.reply("진행중인 업다운👆👇 게임이 종료. 정답 : " + upDownNumber[room]);
			delete upDownNumber[room];
		}
		else
			msg.reply("진행중인 업다운👆👇 게임이 없어.");
	}
	else if (args[0] === "세팅")
	{
		upDownMax = Number(args[1]);
		msg.reply("업다운👆👇 최대 : 1 ~" + upDownMax);
	}
	else
	{
		if (!upDownNumber.hasOwnProperty(room))
			return;

		var input = Number(args[0]);

		if (input === 0)
			msg.reply("숫자가 아닌데?");

		if (upDownNumber[room] == input)
		{
			delete upDownNumber[room];
			msg.reply(sender + "이(가) 정답! 업다운👆👇 게임이 종료.");
		}
		else if (upDownNumber[room] > input)
			msg.reply("👆업!");
		else
			msg.reply("👇다운!");
	}
}

//네이버 별자리 운세
function getAstroLogicalSign(msg, arg)
{
	try
	{
		var value = astroLogy[arg];

		if (!value)
		{
			msg.reply(arg + " 별자리✴️는 없네?");
			return;
		}

		var url = Jsoup.connect("https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=" + arg + "자리운세").get().select("#yearFortune > div");
		var year = url.select("div:nth-child(3) > div.detail.detail2._togglePanelSelectLink > p").text();

		msg.reply("🌟오늘의 "+ arg + "자리 운세🌟" + "\n\n" + year);
	}
	catch (e)
	{
		Log.error(e);
	}
}

//네이버 띠별 운세 가져오기
function getFortuneTeller(name)
{
	try
	{
		wait(1);

		var url = Jsoup.connect("https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=" + name + " 운세").get().select("#yearFortune > div");
		var year = url.select("div:nth-child(3) > div.detail._togglePanelSelectLink > p").text();
		var year3 = url.select("div:nth-child(3) > dl > div:nth-child(3) > dt").get(0).text();
		var year3Text = url.select("div:nth-child(3) > dl > div:nth-child(3) > dd").text();
		var year4 = url.select("div:nth-child(3) > dl > div:nth-child(4) > dt").get(0).text();
		var year4Text = url.select("div:nth-child(3) > dl > div:nth-child(4) > dd").text();

		return "[" + name + "]\n\n" + year + "\n\n" + year3 + " | " + year3Text + "\n\n" + year4 + " | " + year4Text + "\n\n";
	}
	catch (e)
	{
		Log.error(e);
		return "";
	}
}

function wait(sec)
{
	var start = Date.now();
	now = start;

	//0.3 * sec
	while (now - start < sec * 300)
	{
		now = Date.now();
	}
}

function setBirthday(msg, sender)
{

}

//네이버 띠별 전체 운세 가져오기
function getAllZodiacFortuneTeller(msg)
{
	//운세 계속 가져오는 부분 블록
	if (getFortuneTellerNow)
		return;

	fileCheck(zodiacFortuneTellerPath);
	var zodiacToday = JSON.parse(fs.read(zodiacFortuneTellerPath));
	var index = zodiacToday.findIndex(n => n.today === date(0));

	if (index > -1)
	{
		msg.reply(date(0) + "\n" + zodiacToday[index].contents + "\u200b".repeat(500));
	}
	else
	{
		msg.reply("🐭🐮🦁🐰🐉🐍🐴🐑🐵🐓🐶🐷 오늘의 운세 가져오는 중....");
		getFortuneTellerNow = true;

		var contents = "";

		//띠별로 묶기
		zodiac.forEach((n, i, a) => contents += getFortuneTeller(n));

		zodiacToday.push(
		{
			'today': date(0),
			'contents': contents
		});

		fs.write(zodiacFortuneTellerPath, JSON.stringify(zodiacToday));

		msg.reply(date(0) + "\n" + contents + "\u200b".repeat(500));
	}

	getFortuneTellerNow = false;
}

function getNameChemistry(msg, content)
{
	var commandArgs = content.replace(".이름궁합 ", "").trim();
	var nameCompare = commandArgs.split(",");

	if (!nameCompare[1])
		msg.reply("이름 두개가 필요해~ , 안넣은거 아니야? " + commandArgs);

	var n1 = 0;
	var n2 = 0;
	nameCompare[0].trim().normalize("NFD").split("").map(x => n1 += nameChemistryKoreanScore[x] * 2);
	nameCompare[1].trim().normalize("NFD").split("").map(x => n2 += nameChemistryKoreanScore[x] * 2);

	var n3 = n1 + n2;
    var n4 = (n3 > 100) ? n3 - Number(String(n3).slice(0, (String(n3).length - 1)) + "0") * 0.5 : n3;

    msg.reply(nameCompare[0].trim() + (hasFinalConsonant(nameCompare[0].trim()) ? "과 " : "와 ") + nameCompare[1].trim() +"의 이름 궁합\n궁합도 : " + ((n4 > 50) ? n4 : n4 * 2) + "%");
}

function getTaroCardWithGemini(msg) 
{
	try 
	{
		fileCheck(taroCardData);
		
		var taroCardList = JSON.parse(fs.read(taroCardData));
		var location = ["정방향", "역방향"][Math.random() * 2 << 0];
		var taro = Jsoup.connect("https://tarotapi.dev/api/v1/cards/random?n=1").ignoreContentType(!0).maxBodySize(0).method(Connection.Method.GET).execute().body();
		var taroJson = JSON.parse(taro);
		var taroCardName = taroJson.cards[0].name;
		taro += "location: " + location

		var idx = taroCardList.findIndex(c => c.name === taroCardName && c.location === location);

		if (idx > -1)
		{
			msg.reply(taroCardList[idx].content);
		}
		else
		{
			var response = Jsoup.connect("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiKey).ignoreContentType(!0).ignoreHttpErrors(!0).header("Content-Type", "application/json")
			.requestBody(
				JSON.stringify({contents: [{role: "user",parts: [{text: taro + "이 객체를 보고, 한국어 반말로 타로꾼처럼 해석을 가독성 좋게 해 줘." +
			"형식은 다음과 같아. '🔮카드번호: n | 카드: name | 카드 방향: 정방향or역방향\n\n카드 키워드: 키워드\n\n카드 해설: 해설'"}]}]})).timeout(0).method(Connection.Method.POST).execute().body();
		
			var responseJson = JSON.parse(response);
			var result = responseJson.candidates[0].content.parts[0];

			msg.reply(result.text);

			taroCardList.push(
			{
				'name': taroCardName,
				'location': location,
				'content' : result.text
			});

			fs.write(taroCardData, JSON.stringify(taroCardList));
		}
	} 
	catch(e) 
	{
		Log.error("error : " + e + " return :" +JSON.stringify(responseJson));
	}
}

function getTodayMeal(msg, args)
{
	var response = Jsoup.connect("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiKey).ignoreContentType(!0).ignoreHttpErrors(!0).header("Content-Type", "application/json")
	.requestBody(JSON.stringify({contents: [{role: "user",parts: [{text: "내가 너에게 메뉴 질문을 할 거야. 메뉴 말고는 다른 말은 하지마. " + args[0] +" 메뉴 이름을 랜덤으로 다양한 카테고리로 한개만 추천"}]}]})).timeout(0).method(Connection.Method.POST).execute().body();

	var responseJson = JSON.parse(response);
	var result = responseJson.candidates[0].content.parts[0];

	msg.reply(args[0] + " 추천 메뉴는 : " + result.text);
}

function getGeminiSearch(msg)
{
	var content = msg.content.replace(".검색", "");
	var response = Jsoup.connect("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiKey).ignoreContentType(!0).ignoreHttpErrors(!0).header("Content-Type", "application/json").requestBody(JSON.stringify({contents: [{role: "user",parts: [{text: content}]}]})).timeout(0).method(Connection.Method.POST).execute().body();

	var responseJson = JSON.parse(response);
	var result = responseJson.candidates[0].content.parts[0];

	msg.reply("검색 결과 : " + result.text);
}

function getCelebrityCount(msg)
{
	var todayCelebrityIndex = todayCelebrityCount.findIndex(c => c.day === date(0));

	if (todayCelebrityIndex > -1)
		msg.reply("오늘 변우석 총 언급 수 : " + todayCelebrityCount[todayCelebrityIndex].chat);
	else
		msg.reply("오늘 변우석 총 언급 수 : 없음");
}

function getLottoNumber(msg)
{
    var numbers = [];

    while (numbers.length < 6) 
	{
        var num = Math.floor(Math.random() * 45) + 1;

        if (numbers.indexOf(num) === -1)
            numbers.push(num);
    }

    numbers.sort(function(a, b) { return a - b; });

	msg.reply("🎰 로또 6/45\n추천 번호 : " + numbers.join(", "));
}

function getWinnerLottoNumber(msg)
{
    try 
	{
        var url = "https://dhlottery.co.kr/gameResult.do?method=byWin";
        var doc = org.jsoup.Jsoup.connect(url).get();
        
        var roundText = doc.select(".win_result h4 strong").text().replace("회", "");
        var numbers = doc.select(".nums .win span");
        var winningNumbers = [];

        for (var i = 0; i < numbers.size(); i++) 
		{
            winningNumbers.push(parseInt(numbers.get(i).text()));
        }
        
        var bonusNumber = doc.select(".nums .bonus span").text();
        var drawDate = doc.select(".win_result .desc").text();
        
		msg.reply(roundText + "회차 로또 번호 : " + winningNumbers.join(", ") + ", 보너스 번호 : " + bonusNumber + "\n추첨일 : " + drawDate);
    } 
	catch (e) 
	{
		msg.reply("로또 번호를 가져오는데 실패 했어");
        Log.error(e);
    }
}

function startTypingGame(msg, args)
{
	if (isTypingGameNow)
	{
		msg.reply("이미 게임 시작했어 빨리 문구를 쳐줘");
		return;
	}

	args.push("적당하게");

	var response = Jsoup.connect("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiKey).ignoreContentType(!0).ignoreHttpErrors(!0).header("Content-Type", "application/json").requestBody(JSON.stringify({contents: [{role: "user",parts: [{text: "지금 부터 타자게임을 할건데 랜덤하게 문구만 " + args[0] + " 딱 하나 추천해줘"}]}]})).timeout(0).method(Connection.Method.POST).execute().body();

	var responseJson = JSON.parse(response);
	var result = responseJson.candidates[0].content.parts[0];

	msg.reply("타자 게임 문구 시작!\n" + result.text.trim());

	isTypingGameNow = true;
	typingGameSentence = result.text.trim();
	typingGameStart = Date.now();
	typingGameWinner = [];

	setTimeout(() => 
	{
		if (typingGameWinner.length === 0)
		{
			msg.reply("타자게임 종료");
		}
		else
		{
			var winnerList = "타자 게임 종료.\n타자 게임 문구 : " + typingGameSentence + "\n";

			typingGameWinner.forEach(e =>
			{
				winnerList += e.name + " : " + ((Number(e.time) - Number(typingGameStart))/1000) + " 초";
			});

			msg.reply(winnerList);
		}

		isTypingGameNow = false;
		typingGameSentence = "";
		typingGameStart = Date.now();
		typingGameWinner = [];
	}, 30000);
}

function winTypingGameSentence(msg, sender)
{
	var idx = typingGameWinner.findIndex(c => c.name === sender);

	if (idx < 0)
	{
		msg.reply(sender + " 정답!");

		typingGameWinner.push(
		{
			"name":sender,
			"time":Date.now()
		});
	}
}

//메세지 왔을때
bot.addListener(Event.MESSAGE, onMessage);
//커맨드 PreFix에 붙은 메세지가 왔을 때
bot.addListener(Event.COMMAND, onCommand);
//커맨드 앞에 붙일 PreFix 값
bot.setCommandPrefix(".");