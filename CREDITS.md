# 동현테 제작·권리 기록

사용자 Raspberry-Kim의 동현랭 게임 시리즈를 위한 독립 테니스 구현이다. 동현랭 실행기는 기존 동현닥의 실행기를 변경 없이 사용했다.

- **참조 자료**: 사용자가 제공한 Game Boy TENNIS 롬을 비공개 분석에 사용. 조작 설명은 [Nintendo Tennis 원작 설명서](https://www.thegameisafootarcade.com/wp-content/uploads/2017/04/Tennis-Game-Manual.pdf) 참조.
- **캐릭터**: 시리즈의 이름·색·포동이 귀와 주둥이·꽥꽥·잔 다르크 모티프를 테니스용 도트로 단순화. 포동이 얼굴은 시리즈 머리글의 포동이 아이콘을 본떠 새로 찍은 도트(아이콘 이미지를 그대로 쓰지 않음). 슈슈는 동현파 `src/sprites.js`의 `GIRL_ROWS`와 `GIRL_COLORS`를 변경 없이 `src/shushu.js`로 가져와 축소·분절 동작에 사용. 선충 라이언과 구별한다.
- **그래픽·오디오**: 원작 이미지·음원 추출물 없음. Canvas 도트와 Web Audio 합성음으로 작성.
- **코드**: MIT, `LICENSE` 참조.
- **글꼴**: Pretendard, Black Han Sans, Nanum Gothic Coding. 동봉한 OFL 문서 참조.

Nintendo Tennis 및 관련 원작의 권리는 각 권리자에게 있다. 비공식 팬 실험이며 공식 승인·후원·제휴를 표시하지 않는다.
