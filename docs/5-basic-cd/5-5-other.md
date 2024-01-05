---
sidebar-position: 5
---

# 그 외 기능들

Argo CD에서는 언급한 내용 외에도, Application 생성 과정에서 여러 옵션을 설정할 수 있습니다.

## Prune

해당 옵션을 활성화하면 Git에서 리소스를 삭제하고 동기화할 경우, K8S에서도 같이 리소스를 삭제합니다.  
기본적으로는 비활성화되어 있으며, 이 경우 Git 리소스가 삭제되어도 K8S 리소스는 유지됩니다.

## Self-heal

해당 옵션을 활성화하면 항상 Git의 리소스에 정의된 형태로 K8S 리소스가 유지됩니다. 즉, Git 외부에서 K8S 리소르를 직접 변경할 경우 롤백시킵니다.  
자동 동기화가 활성화된 경우에만 해당 기능을 사용할 수 있습니다.

## 파일 필터링

단순 경로 지정 외에 Application에서 특정 파일만 인식하게 하거나, 특정 파일을 제외시킬 수 있습니다.  
자세한 내용은 어래 링크를 참고하세요.  
https://argo-cd.readthedocs.io/en/stable/user-guide/directory/#includingexcluding-files

<br/>

그 외에도 특정 변경사항을 무시하거나, Sync의 정책을 변경하는 등 여러 옵션을 제공하고 있습니다.  
자세한 내용은 [Argo CD 공식 문서][argocd]를 참고해 주세요.

[argocd]: https://argo-cd.readthedocs.io/en/stable/
