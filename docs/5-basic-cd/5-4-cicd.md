---
sidebar_position: 4
---

# CI/CD pipeline 완성하기

![Alt text](image.png)

![Alt text](image-1.png)

이제 Helm chart 연결

https://argo-cd.readthedocs.io/en/stable/user-guide/helm/

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: fastapi-deploy
  namespace: argo-cd
spec:
  destination:
    namespace: fastapi
    server: "https://kubernetes.default.svc"
  source:
    path: fastapi-argo
    repoURL: "https://github.com/BeaverHouse/dive-argo-fastapi-helm.git"
    targetRevision: main
    helm:
      releaseName: dive-argo-fastapi
  sources: []
  project: argo-test
  syncPolicy:
    automated:
      prune: false
      selfHeal: false
    syncOptions:
      - CreateNamespace=true
```

![Alt text](image-2.png)

![Alt text](image-3.png)

![Alt text](image-4.png)

MinIO에서 이벤트 발생

![Alt text](image-5.png)

![Alt text](image-6.png)

![Alt text](image-7.png)

![Alt text](image-8.png)

![Alt text](image-9.png)
