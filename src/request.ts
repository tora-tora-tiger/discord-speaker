// jsonpを利用して棒読みちゃんにメッセージを送信する
export default async function bouyomiTalk(
  text: string, 
  voice: string, 
  volume: string, 
  speed: string, 
  tone: string
): Promise<void> {
  const url = new URL('http://localhost:50080/Talk');
  url.search = new URLSearchParams({
    text: text,
    voice: voice,
    volume: volume,
    speed: speed,
    tone: tone
  }).toString();

  console.log(url.toString());

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    await response.json(); // JSONPではなくJSONを期待する場合
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

bouyomiTalk('a', '0', '-1', '-1', '-1')