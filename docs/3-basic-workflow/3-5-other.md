---
sidebar_position: 5
---

# 기타 편의기능

## Workflow 삭제 조건 설정하기

`retentionPolicy`, `ttlStrategy`, `podGC`

![too many wf](img/3-5-too-many-wf.png)

```yaml {3-6}
controller:
  (...)
  workflowDefaults:
    spec:
      ttlStrategy:
        secondsAfterCompletion: 5
```

이렇게 설정하면 실행 완료 후 5초 뒤에 Workflow 내역이 삭제됩니다.

## Retry 설정하기

Retry는 Template에서 전역으로 적용할 수도 있고[^1], 따로 설정할 수도 있습니다.

[^1]: https://github.com/argoproj/argo-workflows/blob/main/examples/template-defaults.yaml
