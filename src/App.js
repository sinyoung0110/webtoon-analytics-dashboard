// src/App.js
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, RadialBarChart, RadialBar, Area, AreaChart } from 'recharts';
import { useWebtoonData, useTagAnalysis, useHeatmapData, useStatistics, useRecommendations } from './hooks/useWebtoonData';

const WebtoonAnalyticsDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedWebtoon, setSelectedWebtoon] = useState('');
  
  // 실제 데이터 hooks 사용
  const { webtoons, loading: webtoonsLoading, error: webtoonsError } = useWebtoonData();
  const { analysisData, loading: analysisLoading, error: analysisError } = useTagAnalysis();
  const { heatmapData, loading: heatmapLoading, error: heatmapError } = useHeatmapData();
  const { stats, loading: statsLoading, error: statsError } = useStatistics();
  const { recommendations, loading: recommendationsLoading, getRecommendations } = useRecommendations();

  // 추천 처리
  const handleWebtoonSelect = async (title) => {
    setSelectedWebtoon(title);
    if (title) {
      await getRecommendations(title);
    }
  };

  // 로딩 상태 처리
  const isLoading = webtoonsLoading || analysisLoading || statsLoading;
  const hasError = webtoonsError || analysisError || statsError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">데이터 로딩 중...</h2>
          <p className="text-gray-600">웹툰 데이터를 분석하고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">연결 오류</h2>
          <p className="text-gray-600 mb-4">
            백엔드 서버에 연결할 수 없습니다.<br/>
            임시 데이터로 대시보드를 표시합니다.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 실제 통계 데이터 사용 (fallback 포함)
  const displayStats = stats || {
    total_webtoons: webtoons.length,
    avg_rating: webtoons.length > 0 ? (webtoons.reduce((sum, w) => sum + w.rating, 0) / webtoons.length).toFixed(2) : 0,
    avg_interest: webtoons.length > 0 ? Math.round(webtoons.reduce((sum, w) => sum + w.interest_count, 0) / webtoons.length) : 0,
    unique_tags: 127
  };

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98FB98', '#F4A460', '#20B2AA', '#FFB6C1'];

  const tabs = [
    { id: 'overview', name: '전체 개요', icon: '📊', color: 'from-blue-500 to-purple-600' },
    { id: 'network', name: '태그 네트워크', icon: '🕸️', color: 'from-green-500 to-teal-600' },
    { id: 'heatmap', name: '히트맵 분석', icon: '🔥', color: 'from-red-500 to-pink-600' },
    { id: 'recommend', name: '추천 시스템', icon: '🎯', color: 'from-yellow-500 to-orange-600' }
  ];

  // 네트워크 시각화 컴포넌트
  const NetworkVisualization = () => {
    const nodes = analysisData?.network_nodes || [];
    
    return (
      <div className="relative w-full h-96 bg-gradient-to-br from-gray-900 to-blue-900 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-8 p-8">
            {nodes.slice(0, 12).map((node, index) => (
              <div key={node.id} className="relative group">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110"
                  style={{ 
                    width: `${Math.min(80, Math.max(32, node.count * 8))}px`,
                    height: `${Math.min(80, Math.max(32, node.count * 8))}px`
                  }}
                >
                  <span className="text-white font-bold text-xs truncate px-1">
                    {node.id}
                  </span>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {node.count}개 웹툰
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 연결선 애니메이션 효과 */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-ping"
              style={{
                left: `${20 + i * 10}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.5}s`
              }}
            ></div>
          ))}
        </div>
      </div>
    );
  };

  // 히트맵 컴포넌트
  const CustomHeatmap = () => {
    const maxValue = heatmapData.length > 0 ? Math.max(...heatmapData.map(d => d.count)) : 1;
    
    const genres = ['로맨스', '액션', '판타지', '드라마', '무협/사극', '일상'];
    const demographics = ['남성-10대', '남성-20대', '남성-30대', '여성-10대', '여성-20대', '여성-30대'];
    
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-center">성별 × 연령대 × 장르 히트맵</h3>
        <div className="grid grid-cols-7 gap-1 text-xs">
          <div></div>
          {genres.map(genre => (
            <div key={genre} className="p-2 text-center font-semibold">{genre}</div>
          ))}
          
          {demographics.map(demo => (
            <React.Fragment key={demo}>
              <div className="p-2 font-semibold text-right pr-4">{demo}</div>
              {genres.map(genre => {
                const dataPoint = heatmapData.find(d => d.demographic === demo && d.genre === genre);
                const intensity = dataPoint ? dataPoint.count / maxValue : 0;
                
                return (
                  <div
                    key={`${demo}-${genre}`}
                    className="p-3 text-center font-bold text-white rounded transition-all duration-300 hover:scale-110 cursor-pointer"
                    style={{
                      backgroundColor: intensity > 0 ? 
                        `hsl(${200 + intensity * 60}, ${70 + intensity * 30}%, ${30 + intensity * 40}%)` : 
                        '#f3f4f6',
                      color: intensity > 0.3 ? 'white' : '#374151'
                    }}
                    title={`${demo} - ${genre}: ${dataPoint?.count || 0}개`}
                  >
                    {dataPoint?.count || 0}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            🎨 웹툰 데이터 분석 대시보드
          </h1>
          <p className="text-xl text-gray-600">
            AI 기반 태그 네트워킹 & 추천 시스템
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <div className="bg-white rounded-full px-4 py-2 shadow-md">
              <span className="text-sm font-medium text-gray-600">총 웹툰: </span>
              <span className="text-sm font-bold text-blue-600">{displayStats.total_webtoons.toLocaleString()}</span>
            </div>
            <div className="bg-white rounded-full px-4 py-2 shadow-md">
              <span className="text-sm font-medium text-gray-600">평균 평점: </span>
              <span className="text-sm font-bold text-purple-600">{displayStats.avg_rating}</span>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-2xl p-2 flex space-x-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-6 py-4 rounded-xl font-medium transition-all duration-300 ${
                  selectedTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                    : 'text-gray-600 hover:bg-gray-100 hover:scale-102'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* 전체 개요 탭 */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* 주요 지표 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: '총 웹툰 수', value: displayStats.total_webtoons.toLocaleString(), subtitle: '분석 대상', color: 'from-blue-500 to-blue-600', icon: '📚' },
                { title: '평균 평점', value: displayStats.avg_rating, subtitle: '10점 만점', color: 'from-green-500 to-green-600', icon: '⭐' },
                { title: '평균 조회수', value: `${Math.round(displayStats.avg_interest / 1000)}K`, subtitle: '월간 기준', color: 'from-purple-500 to-purple-600', icon: '👀' },
                { title: '태그 다양성', value: displayStats.unique_tags, subtitle: '고유 태그', color: 'from-orange-500 to-orange-600', icon: '🏷️' }
              ].map((card, index) => (
                <div key={index} className={`bg-gradient-to-r ${card.color} text-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl">{card.icon}</div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{card.value}</div>
                      <div className="text-sm opacity-80">{card.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-sm opacity-90">{card.title}</div>
                </div>
              ))}
            </div>

            {/* 차트 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 인기 태그 차트 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">🏆</span>
                  인기 태그 TOP 15
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={(analysisData?.tag_frequency || []).slice(0, 15).map(([tag, count]) => ({ tag, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tag" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', color: 'white', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="url(#colorGradient)">
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.3}/>
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 평점 vs 조회수 산점도 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">💎</span>
                  평점 vs 조회수 관계분석
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="interest_count" 
                      name="조회수" 
                      scale="log"
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis type="number" dataKey="rating" name="평점" domain={[9, 10]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg">
                              <p className="font-bold">{data.title}</p>
                              <p>평점: {data.rating}</p>
                              <p>조회수: {data.interest_count.toLocaleString()}</p>
                              <p>태그: {data.tags.slice(0, 3).join(', ')}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="웹툰" data={webtoons} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 태그 네트워크 탭 */}
        {selectedTab === 'network' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">🕸️ 태그 연관성 네트워크</h2>
              <p className="text-gray-600">태그 간의 연관관계를 시각화하여 웹툰 트렌드를 파악합니다</p>
            </div>
            
            <NetworkVisualization />
            
            {/* 네트워크 인사이트 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                <h4 className="font-bold text-lg mb-2 flex items-center">
                  <span className="mr-2">🎯</span>
                  핵심 태그
                </h4>
                <p className="text-sm opacity-90">
                  '로맨스', '액션', '판타지'가 가장 중심적인 태그로 다른 태그들과 높은 연관성을 보입니다.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl p-6 shadow-lg">
                <h4 className="font-bold text-lg mb-2 flex items-center">
                  <span className="mr-2">🔗</span>
                  강한 연결
                </h4>
                <p className="text-sm opacity-90">
                  '회귀'와 '무협/사극', '로맨스'와 '순정남' 태그가 강한 동시 출현 패턴을 보입니다.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-6 shadow-lg">
                <h4 className="font-bold text-lg mb-2 flex items-center">
                  <span className="mr-2">📈</span>
                  트렌드 예측
                </h4>
                <p className="text-sm opacity-90">
                  네트워크 중심성이 높은 태그들이 향후 웹툰 트렌드를 주도할 가능성이 높습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 히트맵 분석 탭 */}
        {selectedTab === 'heatmap' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">🔥 다차원 히트맵 분석</h2>
              <p className="text-gray-600">성별, 연령대, 장르 간의 복합적 관계를 시각화합니다</p>
            </div>
            
            <CustomHeatmap />
            
            {/* 추가 히트맵들 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 평점 분포 히트맵 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">📊 평점대별 분포</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { range: '9.8-10', count: Math.floor(webtoons.filter(w => w.rating >= 9.8).length), color: 'bg-red-500' },
                    { range: '9.6-9.8', count: Math.floor(webtoons.filter(w => w.rating >= 9.6 && w.rating < 9.8).length), color: 'bg-orange-500' },
                    { range: '9.4-9.6', count: Math.floor(webtoons.filter(w => w.rating >= 9.4 && w.rating < 9.6).length), color: 'bg-yellow-500' },
                    { range: '9.2-9.4', count: Math.floor(webtoons.filter(w => w.rating >= 9.2 && w.rating < 9.4).length), color: 'bg-green-500' },
                    { range: '9.0-9.2', count: Math.floor(webtoons.filter(w => w.rating >= 9.0 && w.rating < 9.2).length), color: 'bg-blue-500' }
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className={`${item.color} text-white p-4 rounded-lg font-bold text-lg`}>
                        {item.count}
                      </div>
                      <div className="text-xs mt-2 text-gray-600">{item.range}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 조회수 분포 히트맵 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">👀 조회수 구간별 분포</h3>
                <div className="space-y-2">
                  {[
                    { range: '1M 이상', count: webtoons.filter(w => w.interest_count >= 1000000).length, percentage: 80 },
                    { range: '500K-1M', count: webtoons.filter(w => w.interest_count >= 500000 && w.interest_count < 1000000).length, percentage: 60 },
                    { range: '100K-500K', count: webtoons.filter(w => w.interest_count >= 100000 && w.interest_count < 500000).length, percentage: 40 },
                    { range: '50K-100K', count: webtoons.filter(w => w.interest_count >= 50000 && w.interest_count < 100000).length, percentage: 20 },
                    { range: '50K 미만', count: webtoons.filter(w => w.interest_count < 50000).length, percentage: 10 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-20 text-sm text-gray-600">{item.range}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 mx-3">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ width: `${Math.max(10, (item.count / Math.max(1, ...webtoons.map(w => w.interest_count))) * 100)}%` }}
                        >
                          {item.count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 추천 시스템 탭 */}
        {selectedTab === 'recommend' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">🎯 AI 웹툰 추천 시스템</h2>
              <p className="text-gray-600">태그 유사도 기반 개인화 추천 엔진</p>
            </div>
            
            {/* 웹툰 선택 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">📚 추천받을 웹툰을 선택하세요</h3>
              <select 
                value={selectedWebtoon}
                onChange={(e) => handleWebtoonSelect(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">웹툰을 선택하세요...</option>
                {webtoons.map(webtoon => (
                  <option key={webtoon.title} value={webtoon.title}>
                    {webtoon.title} (평점: {webtoon.rating})
                  </option>
                ))}
              </select>
            </div>
            
            {/* 추천 결과 */}
            {selectedWebtoon && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-2xl font-bold mb-2">'{selectedWebtoon}'을(를) 좋아한다면...</h3>
                  <p className="opacity-90">다음 웹툰들을 추천드립니다!</p>
                </div>
                
                {recommendationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">추천 분석 중...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-bold text-gray-800">{rec.title}</div>
                          <div className="bg-yellow-400 text-white px-2 py-1 rounded-full text-sm font-bold">
                            #{index + 1}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center">
                            <span className="text-gray-600">평점:</span>
                            <span className="ml-2 font-bold text-green-600">{rec.rating}</span>
                            <div className="ml-2 flex">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`${i < Math.floor(rec.rating)} ? 'text-yellow-400' : 'text-gray-300'`}>
                                  ⭐
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-gray-600">조회수:</span>
                            <span className="ml-2 font-bold text-blue-600">
                              {rec.interest_count.toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-gray-600">유사도:</span>
                            <span className="ml-2 font-bold text-purple-600">
                              {(rec.similarity * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">공통 태그:</div>
                          <div className="flex flex-wrap gap-1">
                            {(rec.common_tags || []).map(tag => (
                              <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">모든 태그:</div>
                          <div className="flex flex-wrap gap-1">
                            {rec.tags.map(tag => (
                              <span key={tag} className={`px-2 py-1 rounded-full text-xs ${
                                (rec.common_tags || []).includes(tag) 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${(rec.similarity || 0.5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 푸터 */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">💡 데이터 기반 인사이트</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-cyan-400 font-bold">트렌드 분석</div>
                <div className="opacity-80">회귀/환생 장르가 급부상하며 20대 남성층에서 높은 인기</div>
              </div>
              <div>
                <div className="text-green-400 font-bold">성별 특성</div>
                <div className="opacity-80">여성향은 감성적 스토리, 남성향은 액션과 성장 서사 선호</div>
              </div>
              <div>
                <div className="text-purple-400 font-bold">연령별 패턴</div>
                <div className="opacity-80">10대는 학원물, 30대는 현실적 드라마에 높은 관심</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebtoonAnalyticsDashboard;