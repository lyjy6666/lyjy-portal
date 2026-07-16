import asyncio
import edge_tts
import base64
import sys
import json

async def generate_tts(text, voice, rate):
    comm = edge_tts.Communicate(text, voice, rate=rate)
    audio_data = b''
    async for chunk in comm.stream():
        if chunk['type'] == 'audio':
            audio_data += chunk['data']
    return audio_data

def main():
    input_data = json.loads(sys.stdin.read())
    text = input_data['text']
    voice = input_data['voice']
    rate = input_data['rate']

    audio_data = asyncio.run(generate_tts(text, voice, rate))
    audio_b64 = base64.b64encode(audio_data).decode('ascii')

    result = {'success': True, 'audioBase64': audio_b64}
    print(json.dumps(result))

if __name__ == '__main__':
    main()
