'use server'

/**
 * 급식 메뉴 관련 Server Actions
 * 나이스 급식식단정보 API를 사용하여 학교 급식 메뉴를 조회합니다.
 */

export interface MealInfo {
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner'
  dishes: string[]
  calories: string | null
  nutrition: string | null
}

export interface MealResult {
  success: boolean
  data?: MealInfo[]
  error?: string
}

/**
 * 오늘의 급식 메뉴를 조회합니다.
 * @returns 급식 메뉴 정보
 */
export async function getTodayMeal(): Promise<MealResult> {
  try {
    const apiKey = process.env.MEAL_API_KEY
    const schoolCode = process.env.MEAL_SCHOOL_CODE
    const officeCode = process.env.MEAL_OFFICE_CODE

    if (!apiKey || !schoolCode || !officeCode) {
      return {
        success: false,
        error: '급식 API 설정이 완료되지 않았습니다. 환경 변수를 확인해주세요.',
      }
    }

    // 오늘 날짜 (YYYYMMDD 형식)
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`

    // 나이스 급식식단정보 API 호출
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo`
    const params = new URLSearchParams({
      KEY: apiKey,
      Type: 'json',
      pIndex: '1',
      pSize: '10',
      ATPT_OFCDC_SC_CODE: officeCode, // 시도교육청코드
      SD_SCHUL_CODE: schoolCode, // 학교코드
      MLSV_YMD: dateStr, // 급식일자
    })

    const response = await fetch(`${url}?${params.toString()}`, {
      next: { revalidate: 3600 }, // 1시간 캐싱
    })

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`)
    }

    const data = await response.json()

    // API 응답 확인
    if (!data.mealServiceDietInfo) {
      return {
        success: true,
        data: [],
      }
    }

    const mealData = data.mealServiceDietInfo[1]?.row || []

    // 급식 정보 파싱
    const meals: MealInfo[] = mealData.map((item: any) => {
      // 식단 메뉴 파싱 (숫자와 특수문자 제거)
      const dishesRaw = item.DDISH_NM || ''
      const dishes = dishesRaw
        .split('<br/>')
        .map((dish: string) => dish.replace(/\d+\./g, '').replace(/[()]/g, '').trim())
        .filter((dish: string) => dish.length > 0)

      // 식사 타입 결정
      let mealType: 'breakfast' | 'lunch' | 'dinner' = 'lunch'
      const mealName = item.MMEAL_SC_NM || ''
      if (mealName.includes('조식') || mealName.includes('아침')) {
        mealType = 'breakfast'
      } else if (mealName.includes('석식') || mealName.includes('저녁')) {
        mealType = 'dinner'
      }

      return {
        date: item.MLSV_YMD,
        mealType,
        dishes,
        calories: item.CAL_INFO || null,
        nutrition: item.NTR_INFO || null,
      }
    })

    return {
      success: true,
      data: meals,
    }
  } catch (error) {
    console.error('급식 메뉴 조회 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '급식 메뉴를 가져오는데 실패했습니다.',
    }
  }
}

/**
 * 특정 날짜의 급식 메뉴를 조회합니다.
 * @param date - YYYY-MM-DD 형식의 날짜
 * @returns 급식 메뉴 정보
 */
export async function getMealByDate(date: string): Promise<MealResult> {
  try {
    const apiKey = process.env.MEAL_API_KEY
    const schoolCode = process.env.MEAL_SCHOOL_CODE
    const officeCode = process.env.MEAL_OFFICE_CODE

    if (!apiKey || !schoolCode || !officeCode) {
      return {
        success: false,
        error: '급식 API 설정이 완료되지 않았습니다.',
      }
    }

    // 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
    const dateStr = date.replace(/-/g, '')

    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo`
    const params = new URLSearchParams({
      KEY: apiKey,
      Type: 'json',
      pIndex: '1',
      pSize: '10',
      ATPT_OFCDC_SC_CODE: officeCode,
      SD_SCHUL_CODE: schoolCode,
      MLSV_YMD: dateStr,
    })

    const response = await fetch(`${url}?${params.toString()}`, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`)
    }

    const data = await response.json()

    if (!data.mealServiceDietInfo) {
      return {
        success: true,
        data: [],
      }
    }

    const mealData = data.mealServiceDietInfo[1]?.row || []

    const meals: MealInfo[] = mealData.map((item: any) => {
      const dishesRaw = item.DDISH_NM || ''
      const dishes = dishesRaw
        .split('<br/>')
        .map((dish: string) => dish.replace(/\d+\./g, '').replace(/[()]/g, '').trim())
        .filter((dish: string) => dish.length > 0)

      let mealType: 'breakfast' | 'lunch' | 'dinner' = 'lunch'
      const mealName = item.MMEAL_SC_NM || ''
      if (mealName.includes('조식') || mealName.includes('아침')) {
        mealType = 'breakfast'
      } else if (mealName.includes('석식') || mealName.includes('저녁')) {
        mealType = 'dinner'
      }

      return {
        date: item.MLSV_YMD,
        mealType,
        dishes,
        calories: item.CAL_INFO || null,
        nutrition: item.NTR_INFO || null,
      }
    })

    return {
      success: true,
      data: meals,
    }
  } catch (error) {
    console.error('급식 메뉴 조회 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '급식 메뉴를 가져오는데 실패했습니다.',
    }
  }
}
