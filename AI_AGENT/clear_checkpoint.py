import asyncio, os, selectors
from psycopg import AsyncConnection
from dotenv import load_dotenv
load_dotenv()

async def clear():
    conn = await AsyncConnection.connect(os.getenv('DATABASE_URL'))
    await conn.set_autocommit(True)
    await conn.execute("DELETE FROM checkpoints WHERE thread_id = '6a21221e153027071ff1f27b'")
    await conn.execute("DELETE FROM checkpoint_writes WHERE thread_id = '6a21221e153027071ff1f27b'")
    await conn.close()
    print('Cleared.')

asyncio.run(clear(), loop_factory=lambda: asyncio.SelectorEventLoop(selectors.SelectSelector()))
