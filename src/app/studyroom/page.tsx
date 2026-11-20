import { redirect } from 'next/navigation';

/** 旧入口兼容：LYJY 自习室现在就是番茄钟 /pomodoro */
export default function StudyRoomPage() {
  redirect('/pomodoro');
}
