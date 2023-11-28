---
sidebar_position: 1
---

# Introduction

앞에서 간단하게 K8S 환경을 구축하고 Argo Workflow 앱을 배포해 보았습니다.  
하지만 지금은 앱에 로그인도 할 수 없고, 서비스도 포트포워딩으로 접근해야 합니다.

더 원활한 사용 환경을 위해 K8S 환경을 고도화시켜 보겠습니다.  
이 챕터에서는 다음 내용을 다룰 예정입니다.

- Multi-node 클러스터 생성하기 (2 worker node 추가)
- MetalLB와 NGINX Ingress Controller로 서비스 노출하기
- Helm chart를 간단히 변경해 Master node에 배포하기
- Argo Workflow에 로그인하기
